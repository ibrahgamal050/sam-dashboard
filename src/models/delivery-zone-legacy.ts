import { Schema, model, models, type Document, type Model, Types } from "mongoose"
import type { GeoJSON } from "geojson"

export type ZoneType = "circle" | "polygon"

export interface DeliveryZoneLegacyDocument extends Document {
  restaurantId: Types.ObjectId
  name: string
  description?: string | null
  delivery_fee: number
  color: string
  zone_type: ZoneType
  geometry: GeoJSON.Geometry & {
    properties?: {
      radius?: number
      [key: string]: unknown
    }
  }
  is_active: boolean
  created_by?: string | null
  createdAt: Date
  updatedAt: Date
}

const DeliveryZoneLegacySchema = new Schema<DeliveryZoneLegacyDocument>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    delivery_fee: { type: Number, required: true, min: 0, default: 0 },
    color: {
      type: String,
      default: "#3B82F6",
      trim: true,
      match: /^#([0-9a-fA-F]{3}){1,2}$/,
    },
    zone_type: {
      type: String,
      enum: ["circle", "polygon"],
      required: true,
    },
    geometry: {
      type: Schema.Types.Mixed,
      required: true,
    },
    is_active: { type: Boolean, default: true },
    created_by: { type: String, default: null },
  },
  {
    timestamps: true,
  },
)

DeliveryZoneLegacySchema.index({ is_active: 1 })
DeliveryZoneLegacySchema.index({ zone_type: 1 })

type DeliveryZoneLegacyModel = Model<DeliveryZoneLegacyDocument>

const DeliveryZoneLegacy =
  (models.DeliveryZoneLegacy as DeliveryZoneLegacyModel | undefined) ||
  model<DeliveryZoneLegacyDocument>("DeliveryZoneLegacy", DeliveryZoneLegacySchema)

export default DeliveryZoneLegacy
