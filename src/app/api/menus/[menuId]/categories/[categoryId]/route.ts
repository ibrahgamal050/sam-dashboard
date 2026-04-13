import { NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import BrandMenuCategory from "@/models/BrandMenuCategory"
import BrandMenuItem from "@/models/BrandMenuItem"

const resolveBrand = async (menuId: string) => {
  if (mongoose.Types.ObjectId.isValid(menuId)) {
    return Brand.findById(menuId).lean()
  }
  return Brand.findOne({ slug: menuId.toLowerCase() }).lean()
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ menuId: string; categoryId: string }> },
) {
  const resolvedParams = await params
  const menuId = decodeURIComponent(resolvedParams.menuId || "")
  const categoryId = resolvedParams.categoryId
  const body = await req.json().catch(() => ({}))

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return NextResponse.json({ error: "Invalid category id." }, { status: 400 })
  }

  await dbConnect()

  const brand = await resolveBrand(menuId)
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 })
  }

  const category = await BrandMenuCategory.findOne({ _id: categoryId, brandId: brand._id })
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 })
  }

  const prevName = category.name?.ar
  category.name = body.name ?? category.name
  await category.save()

  const nextName = category.name?.ar
  if (prevName && nextName && prevName !== nextName) {
    await BrandMenuItem.updateMany(
      { brandId: brand._id, category: prevName },
      { $set: { category: nextName } },
    )
  }

  return NextResponse.json({
    _id: category._id,
    name: category.name,
    menuItems: [],
  })
}

export async function DELETE(
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

  const brand = await resolveBrand(menuId)
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 })
  }

  const category = await BrandMenuCategory.findOne({ _id: categoryId, brandId: brand._id })
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 })
  }

  const categoryName = category.name?.ar
  await BrandMenuCategory.deleteOne({ _id: categoryId, brandId: brand._id })

  if (categoryName) {
    await BrandMenuItem.updateMany(
      { brandId: brand._id, category: categoryName },
      { $set: { category: "غير مصنف" } },
    )
  }

  return NextResponse.json({ ok: true })
}
