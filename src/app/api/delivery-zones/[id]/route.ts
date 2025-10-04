import { NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import DeliveryZone from "@/models/delivery-zone"
import { ZodError } from "zod"

import { updateZoneSchema } from "@/lib/validation/delivery-zone"
import { requireRestaurantAdmin } from "@/lib/auth/permissions"
import { closePolygonRings } from "@/lib/geo/normalize-polygon"
import { serializeZone } from "@/lib/delivery/serialize-zone"

export const dynamic = "force-dynamic"
export const revalidate = 0

type RouteContext = {
  params: {
    id: string
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const zoneId = context.params.id

    await dbConnect()
    const zone = await DeliveryZone.findById(zoneId)
    if (!zone) {
      return NextResponse.json({ error: "Delivery zone not found" }, { status: 404 })
    }

    const auth = requireRestaurantAdmin(request, String(zone.restaurantId))
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const body = await request.json()
    const parsed = updateZoneSchema.parse({ ...body, id: zoneId, restaurantId: String(zone.restaurantId) })

    if (parsed.name !== undefined) zone.name = parsed.name
    if (parsed.fee !== undefined) zone.fee = parsed.fee
    if (parsed.minOrder !== undefined) zone.minOrder = parsed.minOrder
    if (parsed.active !== undefined) zone.active = parsed.active
    if (parsed.color !== undefined) zone.color = parsed.color
    if (parsed.geometry) {
      zone.geometry = {
        type: "Polygon",
        coordinates: closePolygonRings(parsed.geometry.coordinates),
      }
    }

    await zone.save()

    return NextResponse.json({ zone: serializeZone(zone.toObject()) })
  } catch (error) {
    console.error("PATCH /api/delivery-zones/:id error", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Failed to update delivery zone" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const zoneId = context.params.id
    await dbConnect()

    const zone = await DeliveryZone.findById(zoneId)
    if (!zone) {
      return NextResponse.json({ error: "Delivery zone not found" }, { status: 404 })
    }

    const auth = requireRestaurantAdmin(request, String(zone.restaurantId))
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    await zone.deleteOne()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/delivery-zones/:id error", error)
    return NextResponse.json({ error: "Failed to delete delivery zone" }, { status: 500 })
  }
}
