import type { DeliveryZone } from "@/types/delivery-zones"

type DeliveryZoneInput = any

function toIsoString(value: unknown): string {
  if (!value) return new Date().toISOString()
  if (value instanceof Date) return value.toISOString()

  if (typeof value === "string") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }

  return new Date().toISOString()
}

export function serializeDeliveryZone(zone: DeliveryZoneInput): DeliveryZone | null {
  if (!zone) return null

  const plain = typeof (zone as { toObject?: (options?: unknown) => unknown }).toObject === "function"
    ? (zone as { toObject: (options?: unknown) => unknown }).toObject({ versionKey: false })
    : zone

  const typed = plain as {
    _id?: unknown
    restaurantId?: unknown
    supermarketId?: unknown
    name?: string
    description?: string | null
    delivery_fee?: number
    fee?: number
    color?: string
    zone_type?: DeliveryZone["zone_type"]
    geometry?: DeliveryZone["geometry"]
    polygon?: DeliveryZone["geometry"]
    is_active?: boolean
    active?: boolean
    isActive?: boolean
    created_by?: string | null
    createdAt?: unknown
    created_at?: unknown
    updatedAt?: unknown
    updated_at?: unknown
    min_order?: number
    minOrder?: number
    eta_mins?: number
    etaMins?: number
    priority?: number
  }

  const createdAt = typed.createdAt || typed.created_at
  const updatedAt = typed.updatedAt || typed.updated_at
  const geometry = typed.geometry || typed.polygon

  return {
    id: typed._id ? String(typed._id) : "",
    restaurantId: typed.restaurantId ? String(typed.restaurantId) : undefined,
    supermarketId: typed.supermarketId ? String(typed.supermarketId) : undefined,
    name: typed.name || "",
    description: typed.description ?? undefined,
    delivery_fee: typed.delivery_fee ?? typed.fee ?? 0,
    color: typed.color || "#3B82F6",
    zone_type:
      typed.zone_type ||
      (geometry?.type === "Point" ? "circle" : "polygon"),
    geometry:
      geometry ||
      ({ type: "Polygon", coordinates: [] } as DeliveryZone["geometry"]),
    is_active: typed.is_active ?? typed.active ?? typed.isActive ?? false,
    created_by: typed.created_by ?? undefined,
    created_at: toIsoString(createdAt),
    updated_at: toIsoString(updatedAt),
    min_order: typed.min_order ?? typed.minOrder ?? undefined,
    eta_mins: typed.eta_mins ?? typed.etaMins ?? undefined,
    priority: typed.priority ?? undefined,
  }
}

export function serializeDeliveryZones(zones: DeliveryZoneInput[]): DeliveryZone[] {
  return zones
    .map((zone) => serializeDeliveryZone(zone))
    .filter((zone): zone is DeliveryZone => Boolean(zone))
}
