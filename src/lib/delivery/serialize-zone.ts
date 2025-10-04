import type { IDeliveryZone, DeliveryZoneDTO } from "@/types/delivery-zone"

export function serializeZone(zone: Partial<IDeliveryZone> & { _id?: any }): DeliveryZoneDTO {
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
