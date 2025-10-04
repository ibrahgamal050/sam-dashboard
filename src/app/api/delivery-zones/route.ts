import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { ZodError } from "zod"

import dbConnect from "@/lib/dbConnect"
import DeliveryZone from "@/models/delivery-zone"
import { createZoneSchema } from "@/lib/validation/delivery-zone"
import { requireRestaurantAdmin } from "@/lib/auth/permissions"
import { closePolygonRings } from "@/lib/geo/normalize-polygon"
import { serializeZone } from "@/lib/delivery/serialize-zone"
import type { IDeliveryZone } from "@/types/delivery-zone"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const parsed = createZoneSchema.parse(payload)

    const auth = requireRestaurantAdmin(request, parsed.restaurantId)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    await dbConnect()

    const geometry = closePolygonRings(parsed.geometry.coordinates)
    const zone = await DeliveryZone.create({
      restaurantId: new Types.ObjectId(parsed.restaurantId),
      name: parsed.name,
      geometry: { type: "Polygon", coordinates: geometry },
      fee: parsed.fee,
      minOrder: parsed.minOrder,
      active: parsed.active,
      color: parsed.color,
    })

    return NextResponse.json({ zone: serializeZone(zone.toObject()) }, { status: 201 })
  } catch (error) {
    console.error("POST /api/delivery-zones error", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Failed to create delivery zone" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get("restaurantId")
    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId is required" }, { status: 400 })
    }

    const auth = requireRestaurantAdmin(request, restaurantId)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    await dbConnect()

    const zones = await DeliveryZone.find({ restaurantId }).sort({ createdAt: -1 }).lean<IDeliveryZone[]>()
    return NextResponse.json({ zones: zones.map(serializeZone) })
  } catch (error) {
    console.error("GET /api/delivery-zones error", error)
    return NextResponse.json({ error: "Failed to fetch delivery zones" }, { status: 500 })
  }
}
