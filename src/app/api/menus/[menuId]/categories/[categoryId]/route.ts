import { NextResponse } from "next/server"
import { Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import RestaurantMenu from "@/models/RestaurantMenu"
import { getRouteParams, type RouteHandlerContext } from "@/lib/route-params"

export async function PUT(request: Request, context: RouteHandlerContext) {
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

  category.set({
    ...category.toObject(),
    ...payload,
    name: {
      en: payload?.name?.en ?? category.name?.en,
      ar: payload?.name?.ar ?? category.name?.ar,
    },
    updatedAt: new Date(),
  })

  menu.markModified("categories")
  await menu.save()

  return NextResponse.json(JSON.parse(JSON.stringify(category)))
}

export async function DELETE(
  _request: Request,
  context: RouteHandlerContext,
) {
  const { menuId, categoryId } = await getRouteParams<{ menuId?: string; categoryId?: string }>(context)

  if (!menuId || !categoryId) {
    return NextResponse.json({ error: "Invalid identifier" }, { status: 400 })
  }

  if (!Types.ObjectId.isValid(menuId) || !Types.ObjectId.isValid(categoryId)) {
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

  category.deleteOne()
  await menu.save()

  return new NextResponse(null, { status: 204 })
}
