import { ZodError } from "zod"

import { checkPointSchema } from "@/lib/validation/delivery-zone"
import { deliveryZoneCheckInternals } from "./internals"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
