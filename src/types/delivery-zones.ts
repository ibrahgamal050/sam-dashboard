import type { GeoJSON } from "geojson"

export type DeliveryZoneGeometry = GeoJSON.Geometry & {
  properties?: {
    radius?: number
    [key: string]: unknown
  }
}

export interface DeliveryZone {
  id: string
  restaurantId: string
  name: string
  description?: string
  delivery_fee: number
  color: string
  is_active: boolean
  zone_type: "circle" | "polygon"
  geometry: DeliveryZoneGeometry
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CreateDeliveryZoneRequest {
  restaurantId: string
  name: string
  description?: string
  delivery_fee: number
  color: string
  zone_type: "circle" | "polygon"
  geometry: DeliveryZoneGeometry
  is_active?: boolean
}

export interface UpdateDeliveryZoneRequest extends Partial<CreateDeliveryZoneRequest> {
  id: string
  is_active?: boolean
}

// GeoJSON types for zone geometry
export interface CircleGeometry {
  type: "Point"
  coordinates: [number, number] // [lng, lat]
  properties: {
    radius: number // radius in meters
  }
}

export interface PolygonGeometry {
  type: "Polygon"
  coordinates: number[][][] // Array of linear rings
}
