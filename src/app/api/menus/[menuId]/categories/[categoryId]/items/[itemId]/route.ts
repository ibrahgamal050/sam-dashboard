import { NextResponse } from "next/server"
import { Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import RestaurantMenu from "@/models/RestaurantMenu"

export async function PUT(
  request: Request,
  { params }: { params: { menuId: string; categoryId: string; itemId: string } },
) {
  const { menuId, categoryId, itemId } = params

  if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId) || !Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ error: "Invalid identifier" }, { status: 400 })
  }

  const payload = await request.json()

  await dbConnect()

  const menu = await RestaurantMenu.findById(menuId)

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 })
  }

  const category = menu.categories.id(categoryId)

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const item = category.menuItems.id(itemId)

  if (!item) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
  }

  const normalizedPayload = normalizeItemPayload(payload, item)

  const normalizedSizes =
    payload?.sizes !== undefined
      ? normalizeSizes(payload.sizes)
      : item.sizes?.map((size: any) => normalizeSizeDocument(size))

  item.set({
    ...item.toObject(),
    ...normalizedPayload,
    name: normalizedPayload.name,
    description: normalizedPayload.description,
    sizes: normalizedSizes,
  })

  menu.markModified("categories")
  await menu.save()

  return NextResponse.json(JSON.parse(JSON.stringify(item)))
}

function normalizeSizes(sizes: any): any[] {
  if (!Array.isArray(sizes)) return []

  return sizes.map(normalizeSizeDocument)
}

function normalizeTranslatable(value: any, fallback: any = {}) {
  if (!value || typeof value !== "object") {
    return {
      en: (fallback?.en ?? "").trim(),
      ar: (fallback?.ar ?? "").trim(),
    }
  }

  return {
    en: (value?.en ?? fallback?.en ?? "").trim(),
    ar: (value?.ar ?? fallback?.ar ?? "").trim(),
  }
}

function normalizeSizeDocument(size: any) {
  if (!size) {
    return {
      name: { en: "Size", ar: "حجم" },
      price: 0,
    }
  }

  const normalized: any = {
    name: {
      en: (size?.name?.en ?? "").trim() || (size?.name?.ar ?? "").trim() || "Size",
      ar: (size?.name?.ar ?? "").trim() || (size?.name?.en ?? "").trim() || "حجم",
    },
    price: Number.isFinite(Number(size?.price)) ? Number(size?.price) : 0,
  }

  if (size?._id && Types.ObjectId.isValid(size._id)) {
    normalized._id = new Types.ObjectId(size._id)
  }

  return normalized
}

function normalizeItemPayload(payload: any, item: any) {
  const safePayload = payload && typeof payload === "object" ? payload : {}

  return {
    ...safePayload,
    name: normalizeTranslatable(safePayload?.name, item?.name || {}),
    description: normalizeTranslatable(safePayload?.description, item?.description || {}),
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { menuId: string; categoryId: string; itemId: string } },
) {
  const { menuId, categoryId, itemId } = params

  if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId) || !Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ error: "Invalid identifier" }, { status: 400 })
  }

  await dbConnect()

  const menu = await RestaurantMenu.findById(menuId)

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 })
  }

  const category = menu.categories.id(categoryId)

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const item = category.menuItems.id(itemId)

  if (!item) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
  }

  item.deleteOne()
  menu.markModified("categories")
  await menu.save()

  return new NextResponse(null, { status: 204 })
}
