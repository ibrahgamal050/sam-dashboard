import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import SupermarketCategories from "@/models/Category";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id || "");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid supermarket id." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const categories = Array.isArray(body?.categories) ? body.categories : null;

  if (!categories) {
    return NextResponse.json({ error: "Invalid categories payload." }, { status: 400 });
  }

  await dbConnect();

  const updated = await SupermarketCategories.findOneAndUpdate(
    { supermarketId: id },
    {
      $set: { categories, isActive: true },
      $setOnInsert: { supermarketId: id },
    },
    { new: true, upsert: true }
  ).lean();

  return NextResponse.json({ item: updated });
}
