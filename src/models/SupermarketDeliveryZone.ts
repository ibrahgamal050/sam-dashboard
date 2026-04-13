import mongoose, { Schema, type Document, type Model } from "mongoose"

export type GeoPolygon = {
  type: "Polygon"
  coordinates: number[][][]
}

export interface ISupermarketDeliveryZone extends Document {
  supermarketId: mongoose.Types.ObjectId
  name: string
  polygon: GeoPolygon
  fee: number
  minOrder: number
  etaMins: number
  priority: number
  isActive: boolean
  color?: string
  createdAt: Date
  updatedAt: Date
}

const GeoPolygonSchema = new Schema<GeoPolygon>(
  {
    type: { type: String, enum: ["Polygon"], required: true },
    coordinates: { type: [[[Number]]], required: true },
  },
  { _id: false }
)

const SupermarketDeliveryZoneSchema = new Schema<ISupermarketDeliveryZone>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: "SuperMarket", required: true, index: true },
    name: { type: String, required: true, trim: true },
    polygon: { type: GeoPolygonSchema, required: true },
    fee: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, required: true, min: 0, default: 0 },
    etaMins: { type: Number, required: true, min: 0, default: 30 },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    color: { type: String, trim: true, default: "#3B82F6" },
  },
  { timestamps: true }
)

SupermarketDeliveryZoneSchema.index({ polygon: "2dsphere" })
SupermarketDeliveryZoneSchema.index({ supermarketId: 1, priority: -1 })

const SupermarketDeliveryZone: Model<ISupermarketDeliveryZone> =
  mongoose.models.SupermarketDeliveryZone ||
  mongoose.model<ISupermarketDeliveryZone>("SupermarketDeliveryZone", SupermarketDeliveryZoneSchema, "deliveryzones")

export default SupermarketDeliveryZone
