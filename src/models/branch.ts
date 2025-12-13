import mongoose, { Schema, Types } from "mongoose"

export interface IBranch {
  _id: Types.ObjectId
  restaurantId: Types.ObjectId
  name: string
  slug: string
  phone?: string
  whatsapp?: string
  email?: string
  address: {
    line1: string
    line2?: string
    city?: string
    region?: string
    country?: string
    postalCode?: string
    location?: { type: "Point"; coordinates: [number, number] } // [lng, lat]
  }
  openingHours?: Record<string, { open: boolean; intervals: { start: string; end: string }[] }>
  isMain?: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const point = new Schema(
  { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], default: [0, 0] } },
  { _id: false }
)

const branchSchema = new Schema<IBranch>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    phone: String,
    whatsapp: String,
    email: String,
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: String,
      region: String,
      country: String,
      postalCode: String,
      location: point,
    },
    openingHours: { type: Schema.Types.Mixed },
    isMain: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

branchSchema.index({ restaurantId: 1, slug: 1 }, { unique: true })
branchSchema.index({ "address.location": "2dsphere" })

export default mongoose.models.Branch || mongoose.model<IBranch>("Branch", branchSchema)
