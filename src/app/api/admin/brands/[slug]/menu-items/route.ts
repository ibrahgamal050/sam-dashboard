import { NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import BrandMenuItem from "@/models/BrandMenuItem"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const body = await req.json().catch(() => ({}))

  if (!body?.name?.ar || !body?.category || typeof body?.price !== "number") {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
  }

  await dbConnect()

  const brand = mongoose.Types.ObjectId.isValid(slug)
    ? await Brand.findById(slug).lean()
    : await Brand.findOne({ slug: slug.toLowerCase() }).lean()
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 })
  }

  const item = await BrandMenuItem.create({
    brandId: brand._id,
    name: body.name,
    category: body.category,
    price: body.price,
    order: body.order ?? 0,
    isAvailable: body.isAvailable ?? true,
    isActive: true,
  })

  return NextResponse.json({
    item: {
      id: String(item._id),
      name: item.name,
      category: item.category,
      price: item.price,
      order: item.order,
      isAvailable: item.isAvailable,
    },
  })
}
