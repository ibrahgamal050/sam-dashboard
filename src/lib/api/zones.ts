import type { CreateDeliveryZoneRequest, DeliveryZone, UpdateDeliveryZoneRequest } from "@/types/delivery-zones"

const API_BASE = "/api/zones"

type EntityType = "restaurant" | "supermarket"

function requireEntityId(entityId: string): string {
  if (!entityId) {
    throw new Error("entity id is required for delivery zone operations")
  }
  return entityId
}

function buildEntityParams(entityId: string, entityType: EntityType): Record<string, string> {
  return entityType === "supermarket"
    ? { supermarketId: requireEntityId(entityId) }
    : { restaurantId: requireEntityId(entityId) }
}

export class ZonesAPI {
  // Fetch all zones
  static async getZones(
    entityId: string,
    entityType: EntityType = "restaurant",
    activeOnly = false,
  ): Promise<DeliveryZone[]> {
    const params = new URLSearchParams(buildEntityParams(entityId, entityType))
    if (activeOnly) {
      params.set("active", "true")
    }

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch zones: ${response.statusText}`)
    }

    const data = await response.json()
    return data.zones
  }

  // Fetch a specific zone
  static async getZone(entityId: string, id: string, entityType: EntityType = "restaurant"): Promise<DeliveryZone> {
    const params = new URLSearchParams(buildEntityParams(entityId, entityType))
    const response = await fetch(`${API_BASE}/${id}?${params.toString()}`, {
      credentials: "include",
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Zone not found")
      }
      throw new Error(`Failed to fetch zone: ${response.statusText}`)
    }

    const data = await response.json()
    return data.zone
  }

  // Create a new zone
  static async createZone(
    entityId: string,
    entityType: EntityType = "restaurant",
    zoneData: Omit<CreateDeliveryZoneRequest, "restaurantId">,
  ): Promise<DeliveryZone> {
    const response = await fetch(API_BASE, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...zoneData, ...buildEntityParams(entityId, entityType) }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create zone: ${response.statusText}`)
    }

    const data = await response.json()
    return data.zone
  }

  // Update a zone
  static async updateZone(
    entityId: string,
    id: string,
    entityType: EntityType = "restaurant",
    updates: Partial<UpdateDeliveryZoneRequest> | Partial<DeliveryZone>,
  ): Promise<DeliveryZone> {
    const params = new URLSearchParams(buildEntityParams(entityId, entityType))

    const response = await fetch(`${API_BASE}/${id}?${params.toString()}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update zone: ${response.statusText}`)
    }

    const data = await response.json()
    return data.zone
  }

  // Delete a zone
  static async deleteZone(entityId: string, id: string, entityType: EntityType = "restaurant"): Promise<void> {
    const params = new URLSearchParams(buildEntityParams(entityId, entityType))
    const response = await fetch(`${API_BASE}/${id}?${params.toString()}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to delete zone: ${response.statusText}`)
    }
  }

  // Check delivery availability for a location
  static async checkDelivery(
    entityId: string,
    lat: number,
    lng: number,
    entityType: EntityType = "restaurant",
  ): Promise<{
    isDeliveryAvailable: boolean
    zones: DeliveryZone[]
    lowestDeliveryFee: number | null
    location: { lat: number; lng: number }
  }> {
    const response = await fetch(`${API_BASE}/check-delivery`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...buildEntityParams(entityId, entityType), lat, lng }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to check delivery: ${response.statusText}`)
    }

    return response.json()
  }
}
