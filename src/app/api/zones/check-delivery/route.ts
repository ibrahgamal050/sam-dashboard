import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import dbConnect from "@/lib/dbConnect"
import DeliveryZoneLegacy, { type DeliveryZoneLegacyDocument } from "@/models/delivery-zone-legacy"
import SupermarketDeliveryZone from "@/models/SupermarketDeliveryZone"
import { serializeDeliveryZones } from "@/lib/delivery-zones/serialize"
import { Types } from "mongoose"

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function isPointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]

    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) {
      inside = !inside
    }
  }

  return inside
}

// POST /api/zones/check-delivery - Check if a location is within any delivery zone
export async function POST(request: NextRequest) {
  try {
    const { lat, lng, restaurantId, supermarketId } = (await request.json()) as {
      lat?: number
      lng?: number
      restaurantId?: string
      supermarketId?: string
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
    }

    const latitude = lat as number
    const longitude = lng as number

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

    await dbConnect()

    if (supermarketId) {
      const rawZones = await SupermarketDeliveryZone.find({
        supermarketId: new Types.ObjectId(supermarketId),
        isActive: true,
      }).lean()

      const zones = rawZones.map((zone) => ({
        id: zone?._id?.toString?.() ?? String(zone?._id ?? ""),
        restaurantId: undefined,
        supermarketId: zone?.supermarketId?.toString?.() ?? String(zone?.supermarketId ?? ""),
        name: zone?.name ?? "",
        description: undefined,
        delivery_fee: Number(zone?.fee ?? 0),
        color: zone?.color ?? "#3B82F6",
        zone_type: "polygon" as const,
        geometry: zone?.polygon,
        is_active: zone?.isActive ?? true,
        created_at: zone?.createdAt ? new Date(zone.createdAt).toISOString() : new Date().toISOString(),
        updated_at: zone?.updatedAt ? new Date(zone.updatedAt).toISOString() : new Date().toISOString(),
        min_order: zone?.minOrder ?? undefined,
        eta_mins: zone?.etaMins ?? undefined,
        priority: zone?.priority ?? undefined,
      }))

      const availableZones = zones.filter((zone) => {
        if (zone.zone_type === "polygon" && zone.geometry?.type === "Polygon") {
          const polygon = zone.geometry.coordinates[0] as number[][]
          return isPointInPolygon(latitude, longitude, polygon)
        }
        return false
      })

      const isDeliveryAvailable = availableZones.length > 0
      const lowestFee = isDeliveryAvailable
        ? Math.min(...availableZones.map((zone) => zone.delivery_fee))
        : null

      return NextResponse.json({
        isDeliveryAvailable,
        zones: availableZones,
        lowestDeliveryFee: lowestFee,
        location: { lat: latitude, lng: longitude },
      })
    }

    const rawZones = await DeliveryZoneLegacy.find({
      restaurantId: new Types.ObjectId(restaurantId),
      is_active: true,
    }).lean<DeliveryZoneLegacyDocument[]>()
    const zones = serializeDeliveryZones(rawZones as DeliveryZoneLegacyDocument[])

    const availableZones = zones.filter((zone) => {
      if (zone.zone_type === "circle" && zone.geometry.type === "Point") {
        const [zoneLng, zoneLat] = zone.geometry.coordinates as [number, number]
        const radius = zone.geometry?.properties?.radius ?? 1000
        const distance = haversineDistance(latitude, longitude, zoneLat, zoneLng)
        return distance <= radius
      }

      if (zone.zone_type === "polygon" && zone.geometry.type === "Polygon") {
        const polygon = zone.geometry.coordinates[0] as number[][]
        return isPointInPolygon(latitude, longitude, polygon)
      }

      return false
    })

    const isDeliveryAvailable = availableZones.length > 0
    const lowestFee = isDeliveryAvailable
      ? Math.min(...availableZones.map((zone) => zone.delivery_fee))
      : null

    return NextResponse.json({
      isDeliveryAvailable,
      zones: availableZones,
      lowestDeliveryFee: lowestFee,
      location: { lat: latitude, lng: longitude },
    })
  } catch (error) {
    console.error("[v0] Unexpected error in POST /api/zones/check-delivery:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
