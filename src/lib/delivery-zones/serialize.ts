import type { LeanDocument } from "mongoose"

import type { DeliveryZoneLegacyDocument } from "@/models/delivery-zone-legacy"
import type { DeliveryZone } from "@/types/delivery-zones"

type DeliveryZoneInput =
  | DeliveryZoneLegacyDocument
  | LeanDocument<DeliveryZoneLegacyDocument>
  | (Partial<DeliveryZoneLegacyDocument> & { _id?: unknown; createdAt?: unknown; updatedAt?: unknown })
  | null
  | undefined

function toIsoString(value: unknown): string {
  if (!value) {
    return new Date().toISOString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === "string") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return new Date().toISOString()
}

export function serializeDeliveryZone(zone: DeliveryZoneInput): DeliveryZone | null {
  if (!zone) {
    return null
  }

  const plain = typeof (zone as DeliveryZoneLegacyDocument).toObject === "function"
    ? (zone as DeliveryZoneLegacyDocument).toObject({ versionKey: false })
    : zone

  const idValue = (plain as { _id?: unknown })._id
  const restaurantIdValue = (plain as { restaurantId?: unknown }).restaurantId
  const createdAt = (plain as { createdAt?: unknown; created_at?: unknown }).createdAt ||
    (plain as { created_at?: unknown }).created_at
  const updatedAt = (plain as { updatedAt?: unknown; updated_at?: unknown }).updatedAt ||
    (plain as { updated_at?: unknown }).updated_at

  return {
    id: typeof idValue === "string" ? idValue : idValue ? String(idValue) : "",
    restaurantId:
      typeof restaurantIdValue === "string"
        ? restaurantIdValue
        : restaurantIdValue
          ? String(restaurantIdValue)
          : "",
    name: (plain as { name?: string }).name || "",
    description: (plain as { description?: string | null }).description ?? undefined,
    delivery_fee: (plain as { delivery_fee?: number }).delivery_fee ?? 0,
    color: (plain as { color?: string }).color || "#3B82F6",
    zone_type: (plain as { zone_type?: DeliveryZone["zone_type"] }).zone_type || "polygon",
    geometry:
      (plain as { geometry?: DeliveryZone["geometry"] }).geometry ||
      ({ type: "Polygon", coordinates: [] } as DeliveryZone["geometry"]),
    is_active: (plain as { is_active?: boolean }).is_active ?? false,
    created_by: (plain as { created_by?: string | null }).created_by ?? undefined,
    created_at: toIsoString(createdAt),
    updated_at: toIsoString(updatedAt),
  }
}

export function serializeDeliveryZones(zones: DeliveryZoneInput[]): DeliveryZone[] {
  return zones
    .map((zone) => serializeDeliveryZone(zone))
    .filter((zone): zone is DeliveryZone => Boolean(zone))
}
