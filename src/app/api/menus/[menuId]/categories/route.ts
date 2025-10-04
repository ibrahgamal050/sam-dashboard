import { NextResponse } from "next/server"
import { Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import RestaurantMenu from "@/models/RestaurantMenu"

export async function POST(request: Request, { params }: { params: { menuId: string } }) {
  const { menuId } = params

  if (!Types.ObjectId.isValid(menuId)) {
    return NextResponse.json({ error: "Invalid menu id" }, { status: 400 })
  }

  const payload = await request.json()

  await dbConnect()

  const menu = await RestaurantMenu.findById(menuId)

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 })
  }

  const newCategoryId = new Types.ObjectId()
  const categoryName = payload?.name ?? { en: "New Section", ar: "قسم جديد" }

  const newCategory: any = {
    _id: newCategoryId,
    name: {
      en: categoryName?.en ?? categoryName?.ar ?? "New Section",
      ar: categoryName?.ar ?? categoryName?.en ?? "قسم جديد",
    },
    description: payload?.description ?? {},
    image: payload?.image,
    menuItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  menu.categories.push(newCategory)
  menu.markModified("categories")
  await menu.save()

  const createdCategory = menu.categories.id(newCategoryId)

  const serialized = createdCategory ? JSON.parse(JSON.stringify(createdCategory)) : null

  return NextResponse.json(serialized)
}
