import { NextResponse } from "next/server";
import mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

import dbConnect from "@/lib/dbConnect";
import BrandMenuItem from "@/models/BrandMenuItem";
import Restaurant from "@/models/Restaurant";
import RestaurantMenuItem, { type IRestaurantMenuItem } from "@/models/RestaurantMenuItem";
import { normalizeMenuType } from "@/lib/menu-types";

type BrandMenuItemLean = {
  _id: mongoose.Types.ObjectId;
  name: unknown;
  description?: unknown;
  images?: Array<{ url?: string }>;
  category: string;
  price?: number | null;
  order?: number;
  isAvailable?: boolean;
  isActive?: boolean;
};

const normalizeObjectId = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as { _id?: unknown; $oid?: unknown };
    if (record.$oid) return String(record.$oid);
    if (record._id) return String(record._id);
  }
  return String(value);
};

const getRestaurantWithBrand = async (restaurantId: string) => {
  const restaurant = await Restaurant.findById(restaurantId).lean();
  if (!restaurant) return { restaurant: null, brandId: null };
  const brandId = normalizeObjectId((restaurant as any).brandId);
  if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
    return { restaurant, brandId: null };
  }
  return { restaurant, brandId };
};

const buildOverrideFilter = (
  restaurantId: mongoose.Types.ObjectId,
  brandItemIds: mongoose.Types.ObjectId[],
  menuType: string,
): FilterQuery<IRestaurantMenuItem> => {
  if (menuType === "delivery") {
    return {
      restaurantId,
      brandMenuItemId: { $in: brandItemIds },
      $or: [{ menuType }, { menuType: { $exists: false } }],
    };
  }
  return { restaurantId, brandMenuItemId: { $in: brandItemIds }, menuType };
};

const buildSingleOverrideFilter = (
  restaurantId: mongoose.Types.ObjectId,
  brandItemId: mongoose.Types.ObjectId,
  menuType: string,
): FilterQuery<IRestaurantMenuItem> => {
  if (menuType === "delivery") {
    return {
      restaurantId,
      brandMenuItemId: brandItemId,
      $or: [{ menuType }, { menuType: { $exists: false } }],
    };
  }
  return { restaurantId, brandMenuItemId: brandItemId, menuType };
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  const resolvedParams = await params;
  const restaurantId = resolvedParams.restaurantId;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return NextResponse.json({ error: "Invalid restaurant id." }, { status: 400 });
  }

  const menuType = normalizeMenuType(new URL(req.url).searchParams.get("menuType"));
  if (!menuType) {
    return NextResponse.json({ error: "Invalid menuType." }, { status: 400 });
  }

  await dbConnect();
  const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);

  const { brandId } = await getRestaurantWithBrand(restaurantId);
  if (!brandId) {
    return NextResponse.json({ error: "Restaurant brand not found." }, { status: 404 });
  }

  const brandObjectId = new mongoose.Types.ObjectId(brandId);
  const brandItems = await BrandMenuItem.find({ brandId: brandObjectId })
    .sort({ order: 1, createdAt: -1 })
    .lean<BrandMenuItemLean[]>();

  const brandItemIds = brandItems.map((item) => item._id);
  const overrides = brandItemIds.length
    ? await RestaurantMenuItem.find(buildOverrideFilter(restaurantObjectId, brandItemIds, menuType)).lean()
    : [];

  const overridesMap = new Map<string, any>();
  overrides.forEach((override) => {
    if (override?.brandMenuItemId) {
      const key = String(override.brandMenuItemId);
      if (!overridesMap.has(key)) {
        overridesMap.set(key, override);
        return;
      }
      if (override?.menuType === menuType) {
        overridesMap.set(key, override);
      }
    }
  });

  const items = brandItems.map((item) => {
    const override = overridesMap.get(String(item._id));
    const defaultPrice = typeof item.price === "number" ? item.price : null;
    const overridePrice = override && typeof override.price === "number" ? override.price : null;
    return {
      id: String(item._id),
      name: item.name,
      description: item.description,
      image: item.images?.[0]?.url,
      category: item.category,
      defaultPrice,
      price: overridePrice ?? defaultPrice,
      isAvailable:
        typeof override?.isAvailable === "boolean" ? override.isAvailable : item.isAvailable ?? true,
      isHidden: override ? !override.isActive : !item.isActive,
      sortOrder:
        typeof override?.order === "number"
          ? override.order
          : typeof item.order === "number"
            ? item.order
            : 0,
      hasOverride: Boolean(override),
    };
  });

  return NextResponse.json({ items });
}

type UpsertPayload = {
  brandItemId?: string;
  price?: number | null;
  isAvailable?: boolean;
  isHidden?: boolean;
  sortOrder?: number | null;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  const resolvedParams = await params;
  const restaurantId = resolvedParams.restaurantId;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return NextResponse.json({ error: "Invalid restaurant id." }, { status: 400 });
  }

  const menuType = normalizeMenuType(new URL(req.url).searchParams.get("menuType"));
  if (!menuType) {
    return NextResponse.json({ error: "Invalid menuType." }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as UpsertPayload;

  if (!body?.brandItemId || !mongoose.Types.ObjectId.isValid(body.brandItemId)) {
    return NextResponse.json({ error: "Invalid brand item id." }, { status: 400 });
  }

  if (typeof body.price !== "number" || Number.isNaN(body.price)) {
    return NextResponse.json({ error: "Price is required." }, { status: 400 });
  }

  if (typeof body.isAvailable !== "boolean" || typeof body.isHidden !== "boolean") {
    return NextResponse.json({ error: "Availability and visibility are required." }, { status: 400 });
  }

  const orderValue =
    typeof body.sortOrder === "number" && !Number.isNaN(body.sortOrder) ? body.sortOrder : 0;

  await dbConnect();
  const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);

  const { brandId } = await getRestaurantWithBrand(restaurantId);
  if (!brandId) {
    return NextResponse.json({ error: "Restaurant brand not found." }, { status: 404 });
  }

  const brandObjectId = new mongoose.Types.ObjectId(brandId);
  const brandMenuItemObjectId = new mongoose.Types.ObjectId(body.brandItemId);
  const item = await BrandMenuItem.findOne({ _id: body.brandItemId, brandId: brandObjectId }).lean<BrandMenuItemLean | null>();
  if (!item) {
    return NextResponse.json({ error: "Brand item not found." }, { status: 404 });
  }

  await RestaurantMenuItem.updateOne(
    buildSingleOverrideFilter(restaurantObjectId, brandMenuItemObjectId, menuType),
    {
      $set: {
        restaurantId: restaurantObjectId,
        brandMenuItemId: brandMenuItemObjectId,
        menuType,
        price: body.price,
        order: orderValue,
        isAvailable: body.isAvailable,
        isActive: !body.isHidden,
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  const resolvedParams = await params;
  const restaurantId = resolvedParams.restaurantId;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return NextResponse.json({ error: "Invalid restaurant id." }, { status: 400 });
  }

  const menuType = normalizeMenuType(new URL(req.url).searchParams.get("menuType"));
  if (!menuType) {
    return NextResponse.json({ error: "Invalid menuType." }, { status: 400 });
  }

  await dbConnect();
  const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);

  const { brandId } = await getRestaurantWithBrand(restaurantId);
  if (!brandId) {
    return NextResponse.json({ error: "Restaurant brand not found." }, { status: 404 });
  }

  const brandObjectId = new mongoose.Types.ObjectId(brandId);
  const brandItems = await BrandMenuItem.find({ brandId: brandObjectId }).lean<BrandMenuItemLean[]>();
  if (!brandItems.length) {
    return NextResponse.json({ ok: true, imported: 0 });
  }

  const operations: Parameters<typeof RestaurantMenuItem.bulkWrite>[0] = brandItems.map((item) => ({
    updateOne: {
      filter: buildSingleOverrideFilter(
        restaurantObjectId,
        new mongoose.Types.ObjectId(String(item._id)),
        menuType,
      ),
      update: {
        $set: { menuType },
        $setOnInsert: {
          restaurantId: restaurantObjectId,
          brandMenuItemId: item._id,
          menuType,
          ...(typeof item.price === "number" ? { price: item.price } : {}),
          order: typeof item.order === "number" ? item.order : 0,
          isAvailable: item.isAvailable ?? true,
          isActive: item.isActive ?? true,
        },
      },
      upsert: true,
    },
  }));

  const result = await RestaurantMenuItem.bulkWrite(operations);

  return NextResponse.json({ ok: true, imported: result.upsertedCount ?? 0 });
}
