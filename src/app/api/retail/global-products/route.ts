import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import GlobalProduct from "@/models/GlobalProduct";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const jsonError = (status: number, message: string, details?: unknown) =>
  NextResponse.json({ error: message, details }, { status });

const safeString = (value: string | null, maxLen = 120) => {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.slice(0, maxLen);
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = safeString(searchParams.get("q"));
  const limitRaw = Number(searchParams.get("limit") || DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT) : DEFAULT_LIMIT;

  await dbConnect();

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$text = { $search: q };
  }

  const items = await GlobalProduct.find(filter)
    .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    data: {
      items: items.map((item) => ({
        id: String(item._id),
        name: item.name,
        slug: item.slug,
        category: item.category,
        subCategory: item.subCategory ?? null,
        images: item.images ?? [],
        unit: item.unit,
      })),
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const nameValue = safeString(body?.name);
  if (!nameValue) {
    return jsonError(400, "يجب إدخال اسم المنتج.");
  }

  const category = safeString(body?.category) || "عام";
  const unit = safeString(body?.unit) || "piece";
  if (!["piece", "kg", "liter", "pack"].includes(unit)) {
    return jsonError(400, "وحدة المنتج غير صحيحة.");
  }

  await dbConnect();

  const existing = await GlobalProduct.findOne({
    $or: [{ "name.ar": nameValue }, { slug: slugify(nameValue) }],
  }).lean();

  if (existing) {
    return NextResponse.json({
      item: {
        id: String(existing._id),
        name: existing.name,
        slug: existing.slug,
        category: existing.category,
        subCategory: existing.subCategory ?? null,
        images: existing.images ?? [],
        unit: existing.unit,
      },
    });
  }

  let slug = slugify(nameValue);
  if (!slug) {
    slug = `product-${Date.now()}`;
  }

  const slugExists = await GlobalProduct.findOne({ slug }).lean();
  if (slugExists) {
    slug = `${slug}-${new mongoose.Types.ObjectId().toString().slice(-6)}`;
  }

  const created = await GlobalProduct.create({
    name: { ar: nameValue },
    slug,
    category,
    unit,
    status: "active",
    createdBy: "merchant",
    images: Array.isArray(body?.images)
      ? body.images
          .map((img: any) => ({ url: String(img?.url || img || "").trim() }))
          .filter((img: any) => img.url)
      : [],
  });

  return NextResponse.json({
    item: {
      id: String(created._id),
      name: created.name,
      slug: created.slug,
      category: created.category,
      subCategory: created.subCategory ?? null,
      images: created.images ?? [],
      unit: created.unit,
    },
  });
}
