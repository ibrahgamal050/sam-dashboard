import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import Restaurant from "@/models/Restaurant";
import SuperMarket from "@/models/SuperMarket";
import { getMeelzaUser } from "@/lib/auth/meelza-session";
import { isOwnerForTarget, type TargetInfo } from "@/lib/auth/ownership";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");

  if (!subdomain) {
    return NextResponse.json({ error: "MISSING_SUBDOMAIN" }, { status: 400 });
  }

  const user = await getMeelzaUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await connectDB();
  const normalized = subdomain.trim().toLowerCase();

  const restaurant = await Restaurant.findOne({
    $or: [{ subdomain: normalized }, { slug: normalized }],
  }).lean<{ _id: mongoose.Types.ObjectId; brandId?: mongoose.Types.ObjectId | null } | null>();
  const target: TargetInfo | null = restaurant
    ? {
        type: "restaurant",
        id: restaurant._id.toString(),
        brandId: restaurant.brandId ? restaurant.brandId.toString() : null,
      }
    : null;

  let resolvedTarget = target;
  if (!resolvedTarget) {
    const supermarket = await SuperMarket.findOne({ slug: normalized }).lean<{
      _id: mongoose.Types.ObjectId
      brandId?: mongoose.Types.ObjectId | null
    } | null>();
    if (supermarket?._id) {
      resolvedTarget = {
        type: "supermarket",
        id: supermarket._id.toString(),
        brandId: supermarket.brandId ? supermarket.brandId.toString() : null,
      };
    }
  }

  if (!resolvedTarget) {
    console.log("[/api/auth/authorize] target not found", {
      email: typeof user?.email === "string" ? user.email : null,
      subdomain: normalized,
    });
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const authorized = isOwnerForTarget(user, resolvedTarget)

  console.log("[/api/auth/authorize] auth check", {
    email: typeof user?.email === "string" ? user.email : null,
    subdomain: normalized,
    target: resolvedTarget,
    userRole: typeof user?.role === "string" ? user.role : null,
    rawRoles: Array.isArray((user as any)?.roles) ? (user as any).roles : null,
    authorized,
  });

  if (!authorized) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, target: resolvedTarget });
}
