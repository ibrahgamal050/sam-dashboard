import { NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import BrandMenuItem from "@/models/BrandMenuItem"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const itemId = resolvedParams.itemId
  const body = await req.json().catch(() => ({}))

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ error: "Invalid item id." }, { status: 400 })
  }

  await dbConnect()

  const brand = mongoose.Types.ObjectId.isValid(slug)
    ? await Brand.findById(slug).lean()
    : await Brand.findOne({ slug: slug.toLowerCase() }).lean()
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 })
  }

  const updated = await BrandMenuItem.findOneAndUpdate(
    { _id: itemId, brandId: brand._id },
    {
      $set: {
        name: body.name,
        category: body.category,
        price: body.price,
        order: body.order ?? 0,
        isAvailable: body.isAvailable ?? true,
      },
    },
    { new: true },
  ).lean()

  if (!updated) {
    return NextResponse.json({ error: "Menu item not found." }, { status: 404 })
  }

  return NextResponse.json({
    item: {
      id: updated._id.toString(),
      name: updated.name,
      category: updated.category,
      price: updated.price,
      order: updated.order,
      isAvailable: updated.isAvailable,
    },
  })
}
