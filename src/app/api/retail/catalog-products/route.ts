import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import CatalogProduct from "@/models/CatalogProduct";
import MerchantProduct from "@/models/MerchantProduct";
import SuperMarket from "@/models/SuperMarket";

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
  const applyToBrandBranches = body?.applyToBrandBranches === true;

  if (
    !mongoose.Types.ObjectId.isValid(supermarketId) ||
    !mongoose.Types.ObjectId.isValid(catalogId) ||
    !mongoose.Types.ObjectId.isValid(merchantProductId)
  ) {
    return NextResponse.json({ error: "Invalid ids provided." }, { status: 400 });
  }

  await dbConnect();

  try {
    if (applyToBrandBranches) {
      const currentMarket = await SuperMarket.findById(supermarketId)
        .select({ brandId: 1 })
        .lean<{ _id: mongoose.Types.ObjectId; brandId?: mongoose.Types.ObjectId | null } | null>();
      if (!currentMarket?.brandId) {
        return NextResponse.json({ error: "هذا السوبرماركت غير مرتبط ببراند." }, { status: 400 });
      }

      const sourceMerchantProduct = await MerchantProduct.findById(merchantProductId).lean();
      if (!sourceMerchantProduct) {
        return NextResponse.json({ error: "المنتج غير موجود داخل هذا الفرع." }, { status: 404 });
      }

      const currentCatalogProduct = await CatalogProduct.findOne({
        supermarketId,
        catalogId,
        sectionId: String(body.sectionId),
        itemId: String(body.itemId),
        merchantProductId,
      }).lean();
      if (currentCatalogProduct) {
        return NextResponse.json({ error: "Catalog product already exists." }, { status: 409 });
      }

      const relatedMarkets = await SuperMarket.find({ brandId: currentMarket.brandId })
        .select({ _id: 1 })
        .lean<{ _id: mongoose.Types.ObjectId }[]>();

      const createdCatalogEntries: Array<{ supermarketId: string; merchantProductId: string; catalogProductId: string }> = [];
      let currentCatalogProductId: string | null = null;

      for (const market of relatedMarkets) {
        const existingMerchantProduct = await MerchantProduct.findOne({
          merchantId: market._id,
          globalProductId: sourceMerchantProduct.globalProductId,
        }).lean();

        const targetMerchantProductId = existingMerchantProduct?._id?.toString?.()
          ? existingMerchantProduct._id.toString()
          : existingMerchantProduct?._id
            ? String(existingMerchantProduct._id)
            : null;

        let resolvedMerchantProductId = targetMerchantProductId;

        if (!resolvedMerchantProductId) {
          const createdMerchant = await MerchantProduct.create({
            merchantId: market._id,
            globalProductId: sourceMerchantProduct.globalProductId,
            price: sourceMerchantProduct.price,
            offerPrice: sourceMerchantProduct.offerPrice,
            available: sourceMerchantProduct.available,
            stock: sourceMerchantProduct.stock,
            minQty: sourceMerchantProduct.minQty,
            maxQty: sourceMerchantProduct.maxQty,
            isActive: sourceMerchantProduct.isActive,
            customName: sourceMerchantProduct.customName,
            customImages: sourceMerchantProduct.customImages,
          });
          resolvedMerchantProductId = String(createdMerchant._id);
        }

        if (!resolvedMerchantProductId) {
          throw new Error("Failed to resolve merchant product for target branch.");
        }

        const existingCatalogProduct = await CatalogProduct.findOne({
          supermarketId: market._id,
          catalogId,
          sectionId: String(body.sectionId),
          itemId: String(body.itemId),
          merchantProductId: resolvedMerchantProductId,
        }).lean();

        const catalogEntry =
          existingCatalogProduct ||
          (await CatalogProduct.create({
            supermarketId: market._id,
            catalogId,
            sectionId: String(body.sectionId),
            itemId: String(body.itemId),
            nodeId: String(body.nodeId),
            merchantProductId: resolvedMerchantProductId,
            order: typeof body.order === "number" ? body.order : 0,
            isActive: true,
          }));

        const catalogProductId =
          catalogEntry._id?.toString?.() ?? String(catalogEntry._id);
        const targetSupermarketId = market._id.toString();

        if (targetSupermarketId === String(supermarketId)) {
          currentCatalogProductId = catalogProductId;
        }

        createdCatalogEntries.push({
          supermarketId: targetSupermarketId,
          merchantProductId: resolvedMerchantProductId,
          catalogProductId,
        });
      }

      const currentEntry =
        createdCatalogEntries.find((entry) => entry.supermarketId === String(supermarketId)) || createdCatalogEntries[0];

      return NextResponse.json({
        item: {
          _id: currentCatalogProductId || currentEntry?.catalogProductId,
          supermarketId: String(supermarketId),
          merchantProductId: currentEntry?.merchantProductId || String(merchantProductId),
          catalogId,
          sectionId: String(body.sectionId),
          itemId: String(body.itemId),
          nodeId: String(body.nodeId),
          order: typeof body.order === "number" ? body.order : 0,
          isActive: true,
        },
        affectedBranches: createdCatalogEntries.length,
      });
    }

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
