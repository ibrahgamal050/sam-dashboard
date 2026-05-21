import type { DeliveryZoneDTO } from "@/types/delivery-zone"

export function serializeZone(
  zone: {
    _id?: any
    restaurantId?: any
    name?: string
    geometry?: any
    fee?: number
    minOrder?: number
    active?: boolean
    color?: string
    createdAt?: Date | string
  },
): DeliveryZoneDTO {
  const restaurantId = zone.restaurantId ? String(zone.restaurantId) : ""
  const geometry = zone.geometry || { type: "Polygon", coordinates: [] }
  return {
    id: zone._id ? String(zone._id) : "",
    restaurantId,
    name: zone.name || "",
    geometry: {
      type: geometry.type,
      coordinates: geometry.coordinates ?? [],
    },
    fee: zone.fee ?? 0,
    minOrder: zone.minOrder ?? 0,
    active: zone.active ?? false,
    color: zone.color ?? "#F97316",
    createdAt: zone.createdAt ? new Date(zone.createdAt).toISOString() : undefined,
  }
}
