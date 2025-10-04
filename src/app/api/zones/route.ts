import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import DeliveryZoneLegacy from "@/models/delivery-zone-legacy"
import { serializeDeliveryZone, serializeDeliveryZones } from "@/lib/delivery-zones/serialize"
import type { CreateDeliveryZoneRequest } from "@/types/delivery-zones"

function validatePayload(body: CreateDeliveryZoneRequest) {
  if (!body.restaurantId || !Types.ObjectId.isValid(body.restaurantId)) {
    return "Valid restaurantId is required"
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

    if (!restaurantId || !Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: "Valid restaurantId is required" }, { status: 400 })
    }

    const restaurantObjectId = new Types.ObjectId(restaurantId)

    const filters = activeOnly
      ? { restaurantId: restaurantObjectId, is_active: true }
      : { restaurantId: restaurantObjectId }

    const zones = await DeliveryZoneLegacy.find(filters).sort({ createdAt: -1 }).lean()

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

    const zone = await DeliveryZoneLegacy.create({
      restaurantId: new Types.ObjectId(body.restaurantId),
      name: body.name.trim(),
      description: body.description?.trim() || null,
      delivery_fee: body.delivery_fee ?? 0,
      color: body.color || "#3B82F6",
      zone_type: body.zone_type,
      geometry: body.geometry,
      is_active: body.is_active ?? true,
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
