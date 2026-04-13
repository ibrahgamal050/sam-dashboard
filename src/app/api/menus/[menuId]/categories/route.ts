import { NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import BrandMenuCategory from "@/models/BrandMenuCategory"

const resolveBrand = async (menuId: string) => {
  if (mongoose.Types.ObjectId.isValid(menuId)) {
    return Brand.findById(menuId).lean()
  }
  return Brand.findOne({ slug: menuId.toLowerCase() }).lean()
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ menuId: string }> },
) {
  const resolvedParams = await params
  const menuId = decodeURIComponent(resolvedParams.menuId || "")
  const body = await req.json().catch(() => ({}))

  if (!body?.name?.ar) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 })
  }

  await dbConnect()

  const brand = await resolveBrand(menuId)
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 })
  }

  const lastCategory = await BrandMenuCategory.findOne({ brandId: brand._id })
    .sort({ order: -1 })
    .lean()
  const order = typeof lastCategory?.order === "number" ? lastCategory.order + 1 : 0

  const category = await BrandMenuCategory.create({
    brandId: brand._id,
    name: body.name,
    order,
    isActive: true,
  })

  return NextResponse.json({
    _id: category._id,
    name: category.name,
    menuItems: [],
  })
}
