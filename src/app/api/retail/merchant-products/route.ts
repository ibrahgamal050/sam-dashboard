import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import MerchantProduct from "@/models/MerchantProduct";

const jsonError = (status: number, message: string, details?: unknown) =>
  NextResponse.json({ error: message, details }, { status });

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const merchantId = String(body?.merchantId || "");
  const globalProductId = String(body?.globalProductId || "");
  const price = typeof body?.price === "number" ? body.price : Number(body?.price || 0);
  const customImages = Array.isArray(body?.customImages)
    ? body.customImages
        .map((img: any) => ({ url: String(img?.url || img || "").trim() }))
        .filter((img: any) => img.url)
    : [];

  if (!mongoose.Types.ObjectId.isValid(merchantId)) {
    return jsonError(400, "معرف السوبرماركت غير صالح.");
  }
  if (!mongoose.Types.ObjectId.isValid(globalProductId)) {
    return jsonError(400, "معرف المنتج العام غير صالح.");
  }
  if (!Number.isFinite(price) || price < 0) {
    return jsonError(400, "السعر غير صالح.");
  }

  await dbConnect();

  const existing = await MerchantProduct.findOne({
    merchantId,
    globalProductId,
  }).lean();

  if (existing) {
    return NextResponse.json({ item: existing });
  }

  const created = await MerchantProduct.create({
    merchantId,
    globalProductId,
    price,
    available: true,
    isActive: true,
    customImages: customImages.length ? customImages : undefined,
  });

  return NextResponse.json({ item: created });
}
