import { NextResponse } from "next/server"
import { Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import RestaurantMenu from "@/models/RestaurantMenu"
import { getRouteParams, type RouteHandlerContext } from "@/lib/route-params"

export async function POST(request: Request, context: RouteHandlerContext) {
  const { menuId, categoryId } = await getRouteParams<{ menuId?: string; categoryId?: string }>(context)

  if (!menuId || !categoryId) {
    return NextResponse.json({ error: "Invalid identifier" }, { status: 400 })
  }

  if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId)) {
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

  const newItemId = new Types.ObjectId()
  const newItem: any = {
    _id: newItemId,
    name: normalizeTranslatable(payload?.name, {}),
    description: normalizeTranslatable(payload?.description, {}),
    price: payload?.price ?? null,
    image: payload?.image ?? "",
    sizes: normalizeSizes(payload?.sizes),
    weight: payload?.weight ?? null,
    quantity: payload?.quantity ?? null,
    isNew: payload?.isNew ?? false,
  }

  category.menuItems.push(newItem)
  menu.markModified("categories")
  await menu.save()

  const createdItem = category.menuItems.id(newItemId) ?? newItem

  const serialized = createdItem ? JSON.parse(JSON.stringify(createdItem)) : null

  return NextResponse.json(serialized)
}

function normalizeSizes(sizes: any): any[] {
  if (!Array.isArray(sizes)) return []

  return sizes.map(normalizeSizeDocument)
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
