import { ZodError } from "zod"

import { checkPointSchema } from "@/lib/validation/delivery-zone"
import type { DeliveryZoneCheckResponse } from "@/types/delivery-zone"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
    const module = await import("@/lib/dbConnect")
    return module.default()
  },
  resolveDeliveryZone: async (restaurantId, lat, lng) => {
    const module = await import("@/lib/delivery/resolve-zone")
    return module.resolveDeliveryZone(restaurantId, lat, lng)
  },
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const parsed = checkPointSchema.parse(payload)

    await deliveryZoneCheckInternals.dbConnect()

    const result = await deliveryZoneCheckInternals.resolveDeliveryZone(
      parsed.restaurantId,
      parsed.lat,
      parsed.lng,
    )
    return Response.json(result)
  } catch (error) {
    console.error("POST /api/delivery-zones/check error", error)
    if (error instanceof ZodError) {
      return Response.json({ error: "Validation failed", details: error.issues }, { status: 422 })
    }
    return Response.json({ error: "Failed to evaluate delivery zone" }, { status: 500 })
  }
}
