import { NextResponse } from "next/server"
import mongoose from "mongoose"
import type { FilterQuery } from "mongoose"
import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import BrandMenuCategory from "@/models/BrandMenuCategory"
import BrandMenuItem from "@/models/BrandMenuItem"
import Restaurant from "@/models/Restaurant"
import RestaurantMenuItem, { type IRestaurantMenuItem } from "@/models/RestaurantMenuItem"
import { normalizeMenuType } from "@/lib/menu-types"

const resolveBrand = async (menuId: string) => {
  if (mongoose.Types.ObjectId.isValid(menuId)) {
    return Brand.findById(menuId).lean<{ _id: mongoose.Types.ObjectId } | null>()
  }
  return Brand.findOne({ slug: menuId.toLowerCase() }).lean<{ _id: mongoose.Types.ObjectId } | null>()
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const resolveRestaurantFromRequest = async (req: Request) => {
  const headerId = req.headers.get("x-restaurant-id")
  if (headerId && mongoose.Types.ObjectId.isValid(headerId)) {
    return Restaurant.findById(headerId).lean<{
      _id: mongoose.Types.ObjectId
      brandId?: mongoose.Types.ObjectId | null
    } | null>()
  }

  const referer = req.headers.get("referer")
  if (!referer) return null

  try {
    const pathname = new URL(referer).pathname
    const match = pathname.match(/\/dashboard\/([^/]+)\/menu/)
    if (!match) return null
    const slug = decodeURIComponent(match[1])
    const escaped = escapeRegExp(slug)
    return Restaurant.findOne({
      $or: [
        { subdomain: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { slug: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    }).lean<{
      _id: mongoose.Types.ObjectId
      brandId?: mongoose.Types.ObjectId | null
    } | null>()
  } catch {
    return null
  }
}

const buildOverrideFilter = (
  restaurantId: mongoose.Types.ObjectId,
  brandMenuItemId: mongoose.Types.ObjectId,
  menuType: string,
): FilterQuery<IRestaurantMenuItem> => {
  if (menuType === "delivery") {
    return {
      restaurantId,
      brandMenuItemId,
      $or: [{ menuType }, { menuType: { $exists: false } }],
    }
  }
  return { restaurantId, brandMenuItemId, menuType }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ menuId: string; categoryId: string; itemId: string }> },
) {
  const resolvedParams = await params
  const menuId = decodeURIComponent(resolvedParams.menuId || "")
  const categoryId = resolvedParams.categoryId
  const itemId = resolvedParams.itemId
  const body = await req.json().catch(() => ({}))
  const menuType = normalizeMenuType(new URL(req.url).searchParams.get("menuType"))

  if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ error: "Invalid ids." }, { status: 400 })
  }
  if (!menuType) {
    return NextResponse.json({ error: "Invalid menuType." }, { status: 400 })
  }

  await dbConnect()

  const restaurant =
    (await resolveRestaurantFromRequest(req)) ||
    (mongoose.Types.ObjectId.isValid(menuId)
      ? await Restaurant.findById(menuId).lean<{
          _id: mongoose.Types.ObjectId
          brandId?: mongoose.Types.ObjectId | null
        } | null>()
      : null)
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 })
  }

  const brand = restaurant?.brandId
    ? await Brand.findById(restaurant.brandId).lean()
    : await resolveBrand(menuId)
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 })
  }

  const category = await BrandMenuCategory.findOne({ _id: categoryId, brandId: brand._id }).lean()
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 })
  }

  const baseItem = await BrandMenuItem.findOne({ _id: itemId, brandId: brand._id }).lean()
  if (!baseItem) {
    return NextResponse.json({ error: "Menu item not found." }, { status: 404 })
  }

  const existingOverride = await RestaurantMenuItem.findOne(
    buildOverrideFilter(restaurant._id, new mongoose.Types.ObjectId(itemId), menuType),
  ).lean()

  const nextPrice =
    typeof body.price === "number"
      ? body.price
      : typeof existingOverride?.price === "number"
        ? existingOverride.price
        : baseItem.price ?? 0
  const nextIsAvailable =
    typeof body.isAvailable === "boolean"
      ? body.isAvailable
      : typeof existingOverride?.isAvailable === "boolean"
        ? existingOverride.isAvailable
        : baseItem.isAvailable ?? true
  const nextIsHidden =
    typeof body.isHidden === "boolean"
      ? body.isHidden
      : typeof existingOverride?.isHidden === "boolean"
        ? existingOverride.isHidden
        : existingOverride?.isActive === false
  const nextOrder =
    typeof body.sortOrder === "number"
      ? body.sortOrder
      : typeof body.order === "number"
        ? body.order
        : typeof existingOverride?.order === "number"
          ? existingOverride.order
          : baseItem.order ?? 0

  await RestaurantMenuItem.updateOne(
    buildOverrideFilter(restaurant._id, new mongoose.Types.ObjectId(String(baseItem._id)), menuType),
    {
      $set: {
        restaurantId: restaurant._id,
        brandMenuItemId: baseItem._id,
        menuType,
        price: nextPrice,
        order: nextOrder,
        isAvailable: nextIsAvailable,
        isActive: !nextIsHidden,
      },
    },
    { upsert: true },
  )

  return NextResponse.json({
    _id: baseItem._id,
    name: baseItem.name,
    description: baseItem.description,
    price: nextPrice,
    image: baseItem.images?.[0]?.url || "",
    sizes: (baseItem.sizes || []).map((size) => ({
      _id: new mongoose.Types.ObjectId(),
      name: { ar: size.label, en: size.label },
      price: size.price,
    })),
    isAvailable: nextIsAvailable,
    isHidden: nextIsHidden,
    sortOrder: nextOrder,
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ menuId: string; categoryId: string; itemId: string }> },
) {
  const resolvedParams = await params
  const menuId = decodeURIComponent(resolvedParams.menuId || "")
  const itemId = resolvedParams.itemId
  const menuType = normalizeMenuType(new URL(req.url).searchParams.get("menuType"))

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ error: "Invalid item id." }, { status: 400 })
  }
  if (!menuType) {
    return NextResponse.json({ error: "Invalid menuType." }, { status: 400 })
  }

  await dbConnect()

  const restaurant =
    (await resolveRestaurantFromRequest(req)) ||
    (mongoose.Types.ObjectId.isValid(menuId)
      ? await Restaurant.findById(menuId).lean<{
          _id: mongoose.Types.ObjectId
          brandId?: mongoose.Types.ObjectId | null
        } | null>()
      : null)
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 })
  }

  const brand = restaurant?.brandId
    ? await Brand.findById(restaurant.brandId).lean()
    : await resolveBrand(menuId)
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 })
  }

  await RestaurantMenuItem.updateOne(
    buildOverrideFilter(restaurant._id, new mongoose.Types.ObjectId(itemId), menuType),
    {
      $set: {
        restaurantId: restaurant._id,
        brandMenuItemId: itemId,
        menuType,
        isActive: false,
      },
    },
    { upsert: true },
  )

  return NextResponse.json({ ok: true })
}
