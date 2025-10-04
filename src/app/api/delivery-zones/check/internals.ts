import type { DeliveryZoneCheckResponse } from "@/types/delivery-zone"

type ResolveDeliveryZoneFn = (
  restaurantId: string,
  lat: number,
  lng: number,
) => Promise<DeliveryZoneCheckResponse>

export const deliveryZoneCheckInternals: {
  dbConnect: () => Promise<unknown>
  resolveDeliveryZone: ResolveDeliveryZoneFn
} = {
  dbConnect: async () => {
    const dbModule = await import("@/lib/dbConnect")
    return dbModule.default()
  },
  resolveDeliveryZone: async (restaurantId, lat, lng) => {
    const zoneModule = await import("@/lib/delivery/resolve-zone")
    return zoneModule.resolveDeliveryZone(restaurantId, lat, lng)
  },
}
