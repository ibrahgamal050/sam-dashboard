import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import DeliveryZone from "@/models/delivery-zone"
import { serializeDeliveryZone } from "@/lib/delivery-zones/serialize"
import type { UpdateDeliveryZoneRequest } from "@/types/delivery-zones"
import { getRouteParams, type RouteHandlerContext } from "@/lib/route-params"

const INVALID_ZONE_TYPE_MESSAGE = 'Invalid zone_type. Must be "circle" or "polygon"'

function buildRestaurantUpdatePayload(body: Partial<UpdateDeliveryZoneRequest>) {
  const updateData: Record<string, unknown> = {}

  if (body.name !== undefined) updateData.name = body.name?.trim()
  if (body.description !== undefined) updateData.description = body.description?.trim() || null
  if (body.delivery_fee !== undefined) updateData.fee = body.delivery_fee
  if (body.delivery_fee !== undefined) updateData.delivery_fee = body.delivery_fee
  if (body.color !== undefined) updateData.color = body.color
  if (body.zone_type !== undefined) updateData.zone_type = body.zone_type
  if (body.geometry !== undefined) updateData.geometry = body.geometry
  if (body.geometry !== undefined) {
    updateData.polygon = body.geometry.type === "Polygon" ? body.geometry : undefined
  }
  if (body.is_active !== undefined) updateData.active = body.is_active
  if (body.is_active !== undefined) updateData.is_active = body.is_active
  if (body.is_active !== undefined) updateData.isActive = body.is_active
  if (body.min_order !== undefined) updateData.minOrder = body.min_order
  if (body.eta_mins !== undefined) updateData.etaMins = body.eta_mins
  if (body.priority !== undefined) updateData.priority = body.priority

  return updateData
}

function buildSupermarketUpdatePayload(body: Partial<UpdateDeliveryZoneRequest>) {
  const updateData: Record<string, unknown> = {}

  if (body.name !== undefined) updateData.name = body.name?.trim()
  if (body.description !== undefined) updateData.description = body.description?.trim() || null
  if (body.delivery_fee !== undefined) updateData.fee = body.delivery_fee
  if (body.delivery_fee !== undefined) updateData.delivery_fee = body.delivery_fee
  if (body.color !== undefined) updateData.color = body.color
  if (body.zone_type !== undefined) updateData.zone_type = body.zone_type
  if (body.geometry !== undefined) updateData.polygon = body.geometry
  if (body.geometry !== undefined) updateData.geometry = body.geometry
  if (body.is_active !== undefined) updateData.active = body.is_active
  if (body.is_active !== undefined) updateData.is_active = body.is_active
  if (body.is_active !== undefined) updateData.isActive = body.is_active
  if (body.min_order !== undefined) updateData.minOrder = body.min_order
  if (body.eta_mins !== undefined) updateData.etaMins = body.eta_mins
  if (body.priority !== undefined) updateData.priority = body.priority

  return updateData
}

// GET /api/zones/[id] - Fetch a specific delivery zone
export async function GET(request: NextRequest, context: RouteHandlerContext) {
  try {
    const { id } = await getRouteParams<{ id?: string }>(context)
    if (!id) {
      return NextResponse.json({ error: "Zone id is required" }, { status: 400 })
    }
    const restaurantId = request.nextUrl.searchParams.get("restaurantId")
    const supermarketId = request.nextUrl.searchParams.get("supermarketId")

    if (restaurantId && supermarketId) {
      return NextResponse.json({ error: "Use either restaurantId or supermarketId" }, { status: 400 })
    }

    if (!restaurantId && !supermarketId) {
      return NextResponse.json({ error: "Valid restaurantId or supermarketId is required" }, { status: 400 })
    }

    if (restaurantId && !Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: "Valid restaurantId is required" }, { status: 400 })
    }

    if (supermarketId && !Types.ObjectId.isValid(supermarketId)) {
      return NextResponse.json({ error: "Valid supermarketId is required" }, { status: 400 })
    }
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid zone id" }, { status: 400 })
    }
    await dbConnect()

    const restaurantObjectId = restaurantId ? new Types.ObjectId(restaurantId) : null
    const supermarketObjectId = supermarketId ? new Types.ObjectId(supermarketId) : null
    const zoneObjectId = new Types.ObjectId(id)

    if (supermarketObjectId) {
      const zone = await DeliveryZone.findOne({
        _id: zoneObjectId,
        supermarketId: supermarketObjectId,
      })

      if (!zone) {
        return NextResponse.json({ error: "Delivery zone not found" }, { status: 404 })
      }

      return NextResponse.json({ zone: serializeDeliveryZone(zone) })
    }

    const zone = await DeliveryZone.findOne({
      _id: zoneObjectId,
      restaurantId: restaurantObjectId,
    })

    if (!zone) {
      return NextResponse.json({ error: "Delivery zone not found" }, { status: 404 })
    }

    return NextResponse.json({ zone: serializeDeliveryZone(zone) })
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/zones/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/zones/[id] - Update a delivery zone
export async function PUT(request: NextRequest, context: RouteHandlerContext) {
  try {
    const { id } = await getRouteParams<{ id?: string }>(context)
    if (!id) {
      return NextResponse.json({ error: "Zone id is required" }, { status: 400 })
    }
    const restaurantId = request.nextUrl.searchParams.get("restaurantId")
    const supermarketId = request.nextUrl.searchParams.get("supermarketId")
    if (restaurantId && supermarketId) {
      return NextResponse.json({ error: "Use either restaurantId or supermarketId" }, { status: 400 })
    }
    if (!restaurantId && !supermarketId) {
      return NextResponse.json({ error: "Valid restaurantId or supermarketId is required" }, { status: 400 })
    }
    if (restaurantId && !Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: "Valid restaurantId is required" }, { status: 400 })
    }
    if (supermarketId && !Types.ObjectId.isValid(supermarketId)) {
      return NextResponse.json({ error: "Valid supermarketId is required" }, { status: 400 })
    }
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid zone id" }, { status: 400 })
    }
    const body = (await request.json()) as Partial<UpdateDeliveryZoneRequest>

    if (body.zone_type && !["circle", "polygon"].includes(body.zone_type)) {
      return NextResponse.json({ error: INVALID_ZONE_TYPE_MESSAGE }, { status: 400 })
    }

    if (body.delivery_fee !== undefined && body.delivery_fee < 0) {
      return NextResponse.json({ error: "Delivery fee cannot be negative" }, { status: 400 })
    }

    if (body.color && !/^#([0-9a-fA-F]{3}){1,2}$/.test(body.color)) {
      return NextResponse.json({ error: "Color must be a valid hex value" }, { status: 400 })
    }

    await dbConnect()

    const restaurantObjectId = restaurantId ? new Types.ObjectId(restaurantId) : null
    const supermarketObjectId = supermarketId ? new Types.ObjectId(supermarketId) : null
    const zoneObjectId = new Types.ObjectId(id)

    if (supermarketObjectId) {
      if (body.zone_type && body.zone_type !== "polygon") {
        return NextResponse.json({ error: "Supermarket zones must be polygons" }, { status: 400 })
      }
      if (body.geometry && body.geometry.type !== "Polygon") {
        return NextResponse.json({ error: "Supermarket zones must be polygons" }, { status: 400 })
      }

      const updateData = buildSupermarketUpdatePayload(body)
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 })
      }

      const zone = await DeliveryZone.findOneAndUpdate(
        { _id: zoneObjectId, supermarketId: supermarketObjectId },
        updateData,
        { new: true },
      )

      if (!zone) {
        return NextResponse.json({ error: "Delivery zone not found or access denied" }, { status: 404 })
      }

      return NextResponse.json({ zone: serializeDeliveryZone(zone) })
    }

    const updateData = buildRestaurantUpdatePayload(body)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 })
    }

    const zone = await DeliveryZone.findOneAndUpdate(
      { _id: zoneObjectId, restaurantId: restaurantObjectId },
      updateData,
      { new: true },
    )

    if (!zone) {
      return NextResponse.json({ error: "Delivery zone not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ zone: serializeDeliveryZone(zone) })
  } catch (error) {
    console.error("[v0] Unexpected error in PUT /api/zones/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/zones/[id] - Delete a delivery zone
export async function DELETE(request: NextRequest, context: RouteHandlerContext) {
  try {
    const { id } = await getRouteParams<{ id?: string }>(context)
    if (!id) {
      return NextResponse.json({ error: "Zone id is required" }, { status: 400 })
    }
    const restaurantId = request.nextUrl.searchParams.get("restaurantId")
    const supermarketId = request.nextUrl.searchParams.get("supermarketId")
    if (restaurantId && supermarketId) {
      return NextResponse.json({ error: "Use either restaurantId or supermarketId" }, { status: 400 })
    }
    if (!restaurantId && !supermarketId) {
      return NextResponse.json({ error: "Valid restaurantId or supermarketId is required" }, { status: 400 })
    }
    if (restaurantId && !Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: "Valid restaurantId is required" }, { status: 400 })
    }
    if (supermarketId && !Types.ObjectId.isValid(supermarketId)) {
      return NextResponse.json({ error: "Valid supermarketId is required" }, { status: 400 })
    }
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid zone id" }, { status: 400 })
    }
    await dbConnect()

    const restaurantObjectId = restaurantId ? new Types.ObjectId(restaurantId) : null
    const supermarketObjectId = supermarketId ? new Types.ObjectId(supermarketId) : null
    const zoneObjectId = new Types.ObjectId(id)

    if (supermarketObjectId) {
      const result = await DeliveryZone.findOneAndDelete({
        _id: zoneObjectId,
        supermarketId: supermarketObjectId,
      })

      if (!result) {
        return NextResponse.json({ error: "Delivery zone not found or access denied" }, { status: 404 })
      }

      return NextResponse.json({ message: "Delivery zone deleted successfully" })
    }

    const result = await DeliveryZone.findOneAndDelete({
      _id: zoneObjectId,
      restaurantId: restaurantObjectId,
    })

    if (!result) {
      return NextResponse.json({ error: "Delivery zone not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ message: "Delivery zone deleted successfully" })
  } catch (error) {
    console.error("[v0] Unexpected error in DELETE /api/zones/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
