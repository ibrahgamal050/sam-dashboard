import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface RetailOrderItem {
  productId: mongoose.Types.ObjectId | string
  name: string
  unitPrice: number
  quantity: number
  subtotal: number
  image?: string
  weight?: string
}

export interface IRetailOrder extends Document {
  userId?: mongoose.Types.ObjectId
  branchId: mongoose.Types.ObjectId
  items: RetailOrderItem[]
  itemsTotal: number
  deliveryFee: number
  commissionFee?: number
  payableTotal: number
  paymentMethod: "cash" | "card" | "wallet"
  paymentStatus: "pending" | "paid" | "failed"
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"
  deliveryAddress: string
  deliveryLocation?: {
    type: "Point"
    coordinates: [number, number]
  }
  createdAt: Date
  updatedAt: Date
}

const RetailOrderItemSchema = new Schema<RetailOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    image: { type: String },
    weight: { type: String },
  },
  { _id: false }
)

const RetailOrderSchema = new Schema<IRetailOrder>(
  {
    userId: { type: Schema.Types.ObjectId },
    branchId: { type: Schema.Types.ObjectId, ref: "SuperMarket", required: true, index: true },
    items: { type: [RetailOrderItemSchema], default: [] },
    itemsTotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    commissionFee: { type: Number },
    payableTotal: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "card", "wallet"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    deliveryAddress: { type: String },
    deliveryLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
  },
  { timestamps: true }
)

RetailOrderSchema.index({ branchId: 1, createdAt: -1 })

const RetailOrder: Model<IRetailOrder> =
  mongoose.models.RetailOrder || mongoose.model<IRetailOrder>("RetailOrder", RetailOrderSchema, "orders")

export default RetailOrder
