import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import CatalogProduct from "@/models/CatalogProduct";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id || "");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid catalog product id." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (typeof body.isActive === "boolean") update.isActive = body.isActive;
  if (typeof body.order === "number") update.order = body.order;
  if (typeof body.sectionId === "string") update.sectionId = body.sectionId;
  if (typeof body.itemId === "string") update.itemId = body.itemId;
  if (typeof body.nodeId === "string") update.nodeId = body.nodeId;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  await dbConnect();

  const updated = await CatalogProduct.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: "Catalog product not found." }, { status: 404 });
  }

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id || "");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid catalog product id." }, { status: 400 });
  }

  await dbConnect();

  const deleted = await CatalogProduct.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ error: "Catalog product not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
