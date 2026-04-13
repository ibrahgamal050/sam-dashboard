import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import MerchantProduct from "@/models/MerchantProduct";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id || "");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid merchant product id." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (typeof body.price === "number") update.price = body.price;
  if (typeof body.offerPrice === "number") update.offerPrice = body.offerPrice;
  if (typeof body.available === "boolean") update.available = body.available;
  if (typeof body.isActive === "boolean") update.isActive = body.isActive;
  if (typeof body.stock === "number") update.stock = body.stock;
  if (typeof body.customName === "string") {
    update.customName = { ar: body.customName };
  } else if (body.customName && typeof body.customName === "object") {
    update.customName = body.customName;
  }
  if (Array.isArray(body.customImages)) {
    update.customImages = body.customImages
      .map((item: any) => (typeof item === "string" ? { url: item } : { url: item?.url || "" }))
      .filter((item: any) => item.url);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  await dbConnect();

  const updated = await MerchantProduct.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: "Merchant product not found." }, { status: 404 });
  }

  return NextResponse.json({ item: updated });
}
