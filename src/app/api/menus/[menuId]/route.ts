import { NextResponse } from "next/server"
import { Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import RestaurantMenu from "@/models/RestaurantMenu"

export async function GET(
  _request: Request,
  { params }: { params: { menuId: string } },
) {
  try {
    const { menuId } = params

    if (!Types.ObjectId.isValid(menuId)) {
      return NextResponse.json({ error: "Invalid menu id" }, { status: 400 })
    }

    await dbConnect()

    const menu = await RestaurantMenu.findById(menuId)

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    return NextResponse.json(JSON.parse(JSON.stringify(menu)))
  } catch (error) {
    console.error("Failed to fetch menu:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch menu"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { menuId: string } }) {
  try {
    const { menuId } = params

    if (!Types.ObjectId.isValid(menuId)) {
      return NextResponse.json({ error: "Invalid menu id" }, { status: 400 })
    }

    const payload = await request.json()

    await dbConnect()

    const update: Record<string, unknown> = {}

    if (payload.name !== undefined) {
      update.name = payload.name
    }
    if (payload.currency !== undefined) {
      update.currency = payload.currency
    }
    if (payload.categories !== undefined) {
      update.categories = sanitizeCategories(payload.categories)
    }
    if (payload.menuImages !== undefined) {
      update.menuImages = sanitizeMenuImages(payload.menuImages)
    }
    update.updatedAt = new Date()

    const updatedMenu = await RestaurantMenu.findByIdAndUpdate(menuId, update, {
      new: true,
      runValidators: true,
    })

    if (!updatedMenu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    return NextResponse.json(JSON.parse(JSON.stringify(updatedMenu)))
  } catch (error) {
    console.error("Failed to update menu:", error)
    const message = error instanceof Error ? error.message : "Failed to update menu"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function sanitizeCategories(categories: any[]): any[] {
  if (!Array.isArray(categories)) return []

  return categories.map((category) => {
    const sanitizedCategory: any = {
      ...category,
      _id: ensureObjectId(category?._id),
      menuItems: sanitizeMenuItems(category?.menuItems),
    }

    if (category?.createdAt) {
      sanitizedCategory.createdAt = new Date(category.createdAt)
    }
    if (category?.updatedAt) {
      sanitizedCategory.updatedAt = new Date(category.updatedAt)
    }

    return sanitizedCategory
  })
}

function sanitizeMenuItems(items: any[]): any[] {
  if (!Array.isArray(items)) return []

  return items.map((item) => {
    const sanitizedItem: any = {
      ...item,
      _id: ensureObjectId(item?._id),
      sizes: sanitizeSizes(item?.sizes),
    }

    if (item?.createdAt) {
      sanitizedItem.createdAt = new Date(item.createdAt)
    }
    if (item?.updatedAt) {
      sanitizedItem.updatedAt = new Date(item.updatedAt)
    }

    return sanitizedItem
  })
}

function sanitizeSizes(sizes: any[]): any[] {
  if (!Array.isArray(sizes)) return []

  return sizes.map((size) => {
    const sanitizedSize: any = {
      name: {
        en: (size?.name?.en ?? '').trim() || (size?.name?.ar ?? '').trim() || 'Size',
        ar: (size?.name?.ar ?? '').trim() || (size?.name?.en ?? '').trim() || 'حجم',
      },
      price: Number.isFinite(Number(size?.price)) ? Number(size?.price) : 0,
      updatedAt: new Date(),
    }

    if (size?._id && Types.ObjectId.isValid(size._id)) {
      sanitizedSize._id = new Types.ObjectId(size._id)
    }

    return sanitizedSize
  })
}

function sanitizeMenuImages(images: any[]): any[] {
  if (!Array.isArray(images)) return []

  return images.map((image) => {
    const sanitizedImage: any = {
      ...image,
    }

    if (image?._id && Types.ObjectId.isValid(image._id)) {
      sanitizedImage._id = new Types.ObjectId(image._id)
    } else {
      sanitizedImage._id = new Types.ObjectId()
    }

    if (image?.createdAt) {
      sanitizedImage.createdAt = new Date(image.createdAt)
    }

    return sanitizedImage
  })
}

function ensureObjectId(value: unknown) {
  if (value && typeof value === "string" && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value)
  }

  if (value instanceof Types.ObjectId) {
    return value
  }

  return new Types.ObjectId()
}
