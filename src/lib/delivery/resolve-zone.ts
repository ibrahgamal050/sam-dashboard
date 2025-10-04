import DeliveryZone from "@/models/delivery-zone"
import { pointInPolygon } from "@/lib/geo/point-in-polygon"
import type { DeliveryZoneCheckResponse, IGeoJSONPolygon } from "@/types/delivery-zone"

function isGeoIndexError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = (error as { code?: number }).code
  if (code === 16755 || code === 27) return true
  const message = (error as Error).message || ""
  return message.includes("2dsphere") || message.includes("geo")
}

type ZoneDoc = {
  _id: unknown
  name: string
  fee: number
  minOrder: number
  active: boolean
  geometry: IGeoJSONPolygon
}

async function queryActiveZone(restaurantId: string, lat: number, lng: number) {
  try {
    const zone = await DeliveryZone.findOne({
      restaurantId,
      active: true,
      geometry: {
        $geoIntersects: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
        },
      },
    })
      .lean<ZoneDoc | null>()
    return zone
  } catch (error) {
    if (isGeoIndexError(error)) {
      return { error }
    }
    throw error
  }
}

async function fallbackZoneSearch(restaurantId: string, lat: number, lng: number) {
  const zones = await DeliveryZone.find({ restaurantId, active: true }).lean<ZoneDoc[]>()
  const point = { lat, lng }
  for (const zone of zones) {
    if (zone.geometry?.type === "Polygon" && pointInPolygon(point, zone.geometry)) {
      return zone
    }
  }
  return null
}

export async function resolveDeliveryZone(
  restaurantId: string,
  lat: number,
  lng: number,
): Promise<DeliveryZoneCheckResponse> {
  const result = await queryActiveZone(restaurantId, lat, lng)
  if (!result) {
    return { inside: false }
  }

  if ("error" in result) {
    const fallback = await fallbackZoneSearch(restaurantId, lat, lng)
    if (fallback) {
      return toResponse(fallback)
    }
    return { inside: false }
  }

  return toResponse(result)
}

function toResponse(zone: ZoneDoc | null): DeliveryZoneCheckResponse {
  if (!zone) return { inside: false }
  return {
    inside: true,
    zone: {
      id: String(zone._id),
      name: zone.name,
      fee: zone.fee,
      minOrder: zone.minOrder,
    },
  }
}
