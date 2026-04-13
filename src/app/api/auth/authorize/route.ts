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
  }).lean<{ _id: mongoose.Types.ObjectId } | null>();
  const target: TargetInfo | null = restaurant
    ? { type: "restaurant", id: restaurant._id.toString() }
    : null;

  let resolvedTarget = target;
  if (!resolvedTarget) {
    const supermarket = await SuperMarket.findOne({ slug: normalized }).lean<{ _id: mongoose.Types.ObjectId } | null>();
    if (supermarket?._id) {
      resolvedTarget = { type: "supermarket", id: supermarket._id.toString() };
    }
  }

  if (!resolvedTarget) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (!isOwnerForTarget(user, resolvedTarget)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, target: resolvedTarget });
}
