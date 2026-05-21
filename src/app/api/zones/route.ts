import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import DeliveryZone from "@/models/delivery-zone"
import { serializeDeliveryZone, serializeDeliveryZones } from "@/lib/delivery-zones/serialize"
import type { CreateDeliveryZoneRequest } from "@/types/delivery-zones"

function validatePayload(body: CreateDeliveryZoneRequest) {
  if (body.restaurantId && body.supermarketId) {
    return "Use either restaurantId or supermarketId, not both"
  }

  const targetId = body.restaurantId || body.supermarketId
  if (!targetId || !Types.ObjectId.isValid(targetId)) {
    return "Valid restaurantId or supermarketId is required"
  }

  if (!body.name || !body.name.trim() || !body.geometry || !body.zone_type) {
    return "Missing required fields: name, geometry, zone_type"
  }

  if (!["circle", "polygon"].includes(body.zone_type)) {
    return 'Invalid zone_type. Must be "circle" or "polygon"'
  }

  if (body.delivery_fee < 0) {
    return "Delivery fee cannot be negative"
  }

  if (body.color && !/^#([0-9a-fA-F]{3}){1,2}$/.test(body.color)) {
    return "Color must be a valid hex value"
  }

  return null
}

// GET /api/zones - Fetch all delivery zones
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active") === "true"
    const restaurantId = searchParams.get("restaurantId")
    const supermarketId = searchParams.get("supermarketId")

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

    if (supermarketId) {
      const marketObjectId = new Types.ObjectId(supermarketId)
      const filters = activeOnly
        ? { supermarketId: marketObjectId, $or: [{ active: true }, { isActive: true }, { is_active: true }] }
        : { supermarketId: marketObjectId }
      const zones = await DeliveryZone.find(filters).sort({ createdAt: -1 }).lean()
      return NextResponse.json({ zones: serializeDeliveryZones(zones) })
    }

    const restaurantObjectId = new Types.ObjectId(restaurantId!)
    const filters = activeOnly
      ? { restaurantId: restaurantObjectId, $or: [{ active: true }, { isActive: true }, { is_active: true }] }
      : { restaurantId: restaurantObjectId }

    const zones = await DeliveryZone.find(filters).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ zones: serializeDeliveryZones(zones) })
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/zones:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/zones - Create a new delivery zone
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateDeliveryZoneRequest
    console.log("[v0] Creating new zone:", body?.name)

    const validationError = validatePayload(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    await dbConnect()

    if (body.supermarketId) {
      if (body.zone_type !== "polygon" || body.geometry?.type !== "Polygon") {
        return NextResponse.json({ error: "Supermarket zones must be polygons" }, { status: 400 })
      }

      const zone = await DeliveryZone.create({
        supermarketId: new Types.ObjectId(body.supermarketId),
        name: body.name.trim(),
        description: body.description?.trim() || null,
        geometry: body.geometry,
        polygon: body.geometry,
        zone_type: "polygon",
        fee: body.delivery_fee ?? 0,
        delivery_fee: body.delivery_fee ?? 0,
        active: body.is_active ?? true,
        is_active: body.is_active ?? true,
        isActive: body.is_active ?? true,
        minOrder: body.min_order ?? 0,
        etaMins: body.eta_mins ?? 30,
        priority: body.priority ?? 0,
        color: body.color || "#3B82F6",
      })

      const serialized = serializeDeliveryZone(zone)
      if (!serialized) {
        throw new Error("Failed to serialize supermarket delivery zone after creation")
      }
      console.log("[v0] Successfully created supermarket zone:", serialized.id)
      return NextResponse.json({ zone: serialized }, { status: 201 })
    }

    const zone = await DeliveryZone.create({
      restaurantId: new Types.ObjectId(body.restaurantId),
      name: body.name.trim(),
      description: body.description?.trim() || null,
      geometry: body.geometry,
      polygon: body.geometry?.type === "Polygon" ? body.geometry : undefined,
      zone_type: body.zone_type,
      fee: body.delivery_fee ?? 0,
      delivery_fee: body.delivery_fee ?? 0,
      color: body.color || "#3B82F6",
      active: body.is_active ?? true,
      is_active: body.is_active ?? true,
      isActive: body.is_active ?? true,
      minOrder: body.min_order ?? 0,
      etaMins: body.eta_mins ?? 30,
      priority: body.priority ?? 0,
      created_by: null,
    })

    const serialized = serializeDeliveryZone(zone)
    if (!serialized) {
      throw new Error("Failed to serialize delivery zone after creation")
    }
    console.log("[v0] Successfully created zone:", serialized.id)
    return NextResponse.json({ zone: serialized }, { status: 201 })
  } catch (error) {
    console.error("[v0] Unexpected error in POST /api/zones:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
