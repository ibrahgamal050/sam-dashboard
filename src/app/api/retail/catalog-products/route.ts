import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import CatalogProduct from "@/models/CatalogProduct";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const requiredFields = [
    "supermarketId",
    "catalogId",
    "sectionId",
    "itemId",
    "nodeId",
    "merchantProductId",
  ];

  for (const field of requiredFields) {
    if (!body?.[field]) {
      return NextResponse.json({ error: `Missing ${field}.` }, { status: 400 });
    }
  }

  const { supermarketId, catalogId, merchantProductId } = body;

  if (
    !mongoose.Types.ObjectId.isValid(supermarketId) ||
    !mongoose.Types.ObjectId.isValid(catalogId) ||
    !mongoose.Types.ObjectId.isValid(merchantProductId)
  ) {
    return NextResponse.json({ error: "Invalid ids provided." }, { status: 400 });
  }

  await dbConnect();

  try {
    const created = await CatalogProduct.create({
      supermarketId,
      catalogId,
      sectionId: String(body.sectionId),
      itemId: String(body.itemId),
      nodeId: String(body.nodeId),
      merchantProductId,
      order: typeof body.order === "number" ? body.order : 0,
      isActive: true,
    });

    return NextResponse.json({ item: created });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "Catalog product already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create catalog product." }, { status: 500 });
  }
}
