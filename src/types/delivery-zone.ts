import type { GeoJsonObject, Polygon } from "geojson"
import type { Types } from "mongoose"

export type IGeoJSONPolygon = Polygon & GeoJsonObject

export interface DeliveryZoneCheckResponse {
  inside: boolean
  zone?: {
    id: string
    name: string
    fee: number
    minOrder: number
  }
}

export interface DeliveryZoneGeometry {
  type: "Polygon"
  coordinates: number[][][]
}

export interface IDeliveryZone {
  _id: Types.ObjectId
  restaurantId: Types.ObjectId
  name: string
  geometry: DeliveryZoneGeometry
  fee: number
  minOrder: number
  active: boolean
  color: string
  createdAt: Date
}

export interface DeliveryZoneDTO {
  id: string
  restaurantId: string
  name: string
  geometry: DeliveryZoneGeometry
  fee: number
  minOrder: number
  active: boolean
  color: string
  createdAt?: string
}
