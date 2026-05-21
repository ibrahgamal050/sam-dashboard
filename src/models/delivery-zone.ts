import mongoose, { Schema, model, models, type Model } from "mongoose"
import type { GeoJSON } from "geojson"

export type ZoneType = "circle" | "polygon"

export interface DeliveryZoneDocument extends mongoose.Document {
  restaurantId?: mongoose.Types.ObjectId
  supermarketId?: mongoose.Types.ObjectId
  name: string
  description?: string | null
  fee?: number
  delivery_fee?: number
  minOrder?: number
  etaMins?: number
  priority?: number
  color: string
  zone_type?: ZoneType
  geometry?: GeoJSON.Geometry & {
    properties?: {
      radius?: number
      [key: string]: unknown
    }
  }
  polygon?: {
    type: "Polygon"
    coordinates: number[][][]
  }
  active?: boolean
  is_active?: boolean
  isActive?: boolean
  created_by?: string | null
  createdAt: Date
  updatedAt: Date
}

const DeliveryZoneSchema = new Schema<DeliveryZoneDocument>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true },
    supermarketId: { type: Schema.Types.ObjectId, ref: "SuperMarket", index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    fee: { type: Number, min: 0, default: undefined },
    delivery_fee: { type: Number, min: 0, default: undefined },
    minOrder: { type: Number, min: 0, default: 0 },
    etaMins: { type: Number, min: 0, default: 30 },
    priority: { type: Number, default: 0 },
    color: {
      type: String,
      trim: true,
      default: "#3B82F6",
      match: /^#([0-9a-fA-F]{3}){1,2}$/,
    },
    zone_type: {
      type: String,
      enum: ["circle", "polygon"],
      default: "polygon",
    },
    geometry: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    polygon: {
      type: {
        type: String,
        enum: ["Polygon"],
      },
      coordinates: {
        type: [[[Number]]],
      },
    },
    active: { type: Boolean, default: undefined },
    is_active: { type: Boolean, default: undefined },
    isActive: { type: Boolean, default: undefined },
    created_by: { type: String, default: null },
  },
  {
    timestamps: true,
  },
)

DeliveryZoneSchema.index({ geometry: "2dsphere" })
DeliveryZoneSchema.index({ polygon: "2dsphere" })
DeliveryZoneSchema.index({ restaurantId: 1, createdAt: -1 })
DeliveryZoneSchema.index({ supermarketId: 1, createdAt: -1 })

type DeliveryZoneModel = Model<DeliveryZoneDocument>

const DeliveryZone =
  (models.DeliveryZone as DeliveryZoneModel | undefined) ||
  model<DeliveryZoneDocument>("DeliveryZone", DeliveryZoneSchema, "deliveryzones")

export default DeliveryZone
