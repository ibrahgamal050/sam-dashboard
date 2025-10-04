import mongoose, { Schema, Document, Model } from 'mongoose'

export type OrderItemState = 'queued' | 'cooking' | 'ready' | 'served'
export interface IOrderItem {
  productId: mongoose.Types.ObjectId | string
  name: string
  modifiers?: string[]
  quantity: number
  price: number
  notes?: string
  state?: OrderItemState
}

export type OrderType = 'dineIn' | 'Pickup' | 'Delivery' | 'pickup' | 'delivery' | 'Dine-in'
export type OrderStatus =
  | 'NEW' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'CANCELED'
  | 'pending' | 'queued' | 'in_progress' | 'ready' | 'served' | 'canceled'|'Start'
  // Legacy values supported for compatibility
  | 'New' | 'Paid' | 'Completed' | 'Rejected'

export type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded'
export type PaymentMethod = 'cash' | 'card' | 'online' | 'wallet' | 'voucher' | 'bank_transfer' | 'mixed'

export interface IOrder extends Document {
  restaurantId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  type?: OrderType
  table?: string
  customer?: { name?: string; phone?: string; address?: string }
  items: IOrderItem[]
  subtotal: number
  deliveryFee?: number
  deliveryZoneId?: mongoose.Types.ObjectId
  deliveryLocation?: {
    lat?: number
    lng?: number
  }
  totalPrice: number
  currency?: string
  payment?: { method: 'cod' | 'card'; status: 'unpaid' | 'paid' | 'failed' }
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
  status: OrderStatus
  eta?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    modifiers: [{ type: String }],
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String },
    state: {
      type: String,
      enum: ['queued', 'cooking', 'ready', 'served'],
      default: 'queued',
    },
  },
  { _id: true }
)

const OrderSchema = new Schema<IOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: false },
    type: { type: String, enum: ['dineIn','Dine-in', 'Pickup', 'pickup', 'Delivery', 'delivery'], default: 'delivery' },
    table: { type: String },
    customer: {
      name: String,
      phone: String,
      address: String,
    },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    deliveryZoneId: { type: Schema.Types.ObjectId, ref: 'DeliveryZone', required: false },
    deliveryLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    payment: {
      method: { type: String, enum: ['cod','card'], default: 'cod' },
      status: { type: String, enum: ['unpaid','paid','failed'], default: 'unpaid' },
    },
    paymentStatus: { type: String, enum: ['unpaid','paid','partially_paid','refunded'], default: 'unpaid', index: true },
    paymentMethod: { type: String, enum: ['cash','card','online','wallet','voucher','bank_transfer','mixed'], default: 'cash', index: true },
    status: {
      type: String,
      enum: [
        'NEW','IN_PROGRESS','READY','SERVED','CANCELED',
        'pending','queued','in_progress','ready','served','canceled',
        // legacy
        'New',
        'Paid',
        'Completed',
        'Rejected',
      ],
      default: 'pending',
      index: true,
    },
    eta: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
)

OrderSchema.index({ restaurantId: 1, createdAt: -1 })

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)

export default Order
