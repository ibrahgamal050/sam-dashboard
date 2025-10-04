import { Schema, model, models, Types } from "mongoose"

const DeliveryZoneSchema = new Schema(
  {
    restaurantId: { type: Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
        default: "Polygon",
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
        validate: {
          validator: (v: number[][][]) => Array.isArray(v) && v.length > 0,
          message: "Polygon coordinates are required",
        },
      },
    },
    fee: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    color: {
      type: String,
      trim: true,
      default: "#F97316",
      match: /^#([0-9a-fA-F]{3}){1,2}$/,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
)

DeliveryZoneSchema.index({ geometry: "2dsphere" })

const DeliveryZone = models.DeliveryZone || model("DeliveryZone", DeliveryZoneSchema)

export default DeliveryZone
