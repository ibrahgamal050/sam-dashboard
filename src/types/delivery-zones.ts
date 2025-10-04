import type { GeoJSON } from "geojson"

export interface DeliveryZone {
  id: string
  restaurantId: string
  name: string
  description?: string
  delivery_fee: number
  color: string
  is_active: boolean
  zone_type: "circle" | "polygon"
  geometry: GeoJSON.Geometry
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
  geometry: GeoJSON.Geometry
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
