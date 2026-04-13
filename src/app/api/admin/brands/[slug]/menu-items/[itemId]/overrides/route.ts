import { NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import BrandMenuItem from "@/models/BrandMenuItem"
import RestaurantMenuItem from "@/models/RestaurantMenuItem"
import { normalizeMenuType } from "@/lib/menu-types"

type OverrideInput = {
  restaurantId: string
  price?: number
  order?: number
  isAvailable?: boolean
}

const buildOverrideFilter = (restaurantId: string, itemId: string, menuType: string) => {
  if (menuType === "delivery") {
    return {
      restaurantId,
      brandMenuItemId: itemId,
      $or: [{ menuType }, { menuType: { $exists: false } }],
    }
  }
  return { restaurantId, brandMenuItemId: itemId, menuType }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const itemId = resolvedParams.itemId
  const body = await req.json().catch(() => ({}))
  const menuType = normalizeMenuType(new URL(req.url).searchParams.get("menuType"))

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ error: "Invalid item id." }, { status: 400 })
  }
  if (!menuType) {
    return NextResponse.json({ error: "Invalid menuType." }, { status: 400 })
  }

  const overrides = Array.isArray(body?.overrides) ? (body.overrides as OverrideInput[]) : []
  if (!overrides.length) {
    return NextResponse.json({ error: "No overrides provided." }, { status: 400 })
  }

  await dbConnect()

  const brand = mongoose.Types.ObjectId.isValid(slug)
    ? await Brand.findById(slug).lean()
    : await Brand.findOne({ slug: slug.toLowerCase() }).lean()
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 })
  }

  const item = await BrandMenuItem.findOne({ _id: itemId, brandId: brand._id }).lean()
  if (!item) {
    return NextResponse.json({ error: "Menu item not found." }, { status: 404 })
  }

  for (const override of overrides) {
    if (!mongoose.Types.ObjectId.isValid(override.restaurantId)) continue
    await RestaurantMenuItem.updateOne(
      buildOverrideFilter(override.restaurantId, itemId, menuType),
      {
        $set: {
          restaurantId: override.restaurantId,
          brandMenuItemId: itemId,
          menuType,
          price: override.price ?? item.price,
          order: override.order ?? item.order ?? 0,
          isAvailable: override.isAvailable ?? true,
          isActive: true,
        },
      },
      { upsert: true },
    )
  }

  return NextResponse.json({ ok: true })
}
