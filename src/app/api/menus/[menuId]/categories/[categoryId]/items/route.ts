import { NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import BrandMenuCategory from "@/models/BrandMenuCategory"
import Restaurant from "@/models/Restaurant"

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ menuId: string; categoryId: string }> },
) {
  const resolvedParams = await params
  const menuId = decodeURIComponent(resolvedParams.menuId || "")
  const categoryId = resolvedParams.categoryId

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return NextResponse.json({ error: "Invalid category id." }, { status: 400 })
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

  return NextResponse.json(
    {
      error: "Items must be created in the brand catalog before overriding a branch menu.",
    },
    { status: 400 },
  )
}
