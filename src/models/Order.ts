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

export const ORDER_TYPES = ['delivery', 'pickup', 'dine_in'] as const
export type OrderType = typeof ORDER_TYPES[number]

export const ORDER_STATUS = [
  'pending',
  'queued',
  'in_progress',
  'ready',
  'served',
  'canceled',
  'completed',
  'rejected',
  'paid',
] as const
export type OrderStatus = typeof ORDER_STATUS[number]

export const PAYMENT_METHODS = ['cash', 'card', 'online', 'wallet', 'voucher', 'bank_transfer', 'mixed'] as const
export type PaymentMethod = typeof PAYMENT_METHODS[number]

export const PAYMENT_STATUS = ['unpaid', 'paid', 'partially_paid', 'refunded', 'failed'] as const
export type PaymentStatus = typeof PAYMENT_STATUS[number]

export interface IOrderPayment {
  method: PaymentMethod
  status: PaymentStatus
}

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
  payment: IOrderPayment
  status: OrderStatus
  eta?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const NORMALIZE_KEY_REGEX = /[\s_-]/g

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(NORMALIZE_KEY_REGEX, '')

const ORDER_TYPE_ALIAS_MAP: Record<string, OrderType> = {
  delivery: 'delivery',
  pickup: 'pickup',
  dinein: 'dine_in',
}

const ORDER_STATUS_ALIAS_MAP: Record<string, OrderStatus> = {
  pending: 'pending',
  new: 'pending',
  start: 'pending',
  queued: 'queued',
  queue: 'queued',
  inprogress: 'in_progress',
  ready: 'ready',
  served: 'served',
  canceled: 'canceled',
  cancelled: 'canceled',
  completed: 'completed',
  complete: 'completed',
  rejected: 'rejected',
  paid: 'paid',
}

const PAYMENT_METHOD_ALIAS_MAP: Record<string, PaymentMethod> = {
  cash: 'cash',
  cod: 'cash',
  card: 'card',
  online: 'online',
  wallet: 'wallet',
  voucher: 'voucher',
  banktransfer: 'bank_transfer',
  bank_transfer: 'bank_transfer',
  mixed: 'mixed',
}

const PAYMENT_STATUS_ALIAS_MAP: Record<string, PaymentStatus> = {
  unpaid: 'unpaid',
  paid: 'paid',
  partiallypaid: 'partially_paid',
  paidpartial: 'partially_paid',
  refunded: 'refunded',
  failed: 'failed',
}

const normalizeValue =
  <T extends string>(aliases: Record<string, T>) =>
  (value: unknown): T | undefined => {
    if (typeof value !== 'string') return undefined
    const normalized = normalizeKey(value)
    return aliases[normalized]
  }

const normalizeOrReturn =
  <T extends string>(normalizer: (value: unknown) => T | undefined) =>
  (value: unknown) => {
    if (value === undefined || value === null) return value as any
    return normalizer(value) ?? value
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
    type: {
      type: String,
      enum: ORDER_TYPES,
      default: 'delivery',
      set: normalizeOrReturn(normalizeValue(ORDER_TYPE_ALIAS_MAP)),
    },
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
      method: {
        type: String,
        enum: PAYMENT_METHODS,
        default: 'cash',
        index: true,
        set: normalizeOrReturn(normalizeValue(PAYMENT_METHOD_ALIAS_MAP)),
      },
      status: {
        type: String,
        enum: PAYMENT_STATUS,
        default: 'unpaid',
        index: true,
        set: normalizeOrReturn(normalizeValue(PAYMENT_STATUS_ALIAS_MAP)),
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: 'pending',
      index: true,
      set: normalizeOrReturn(normalizeValue(ORDER_STATUS_ALIAS_MAP)),
    },
    eta: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
)

OrderSchema.index({ restaurantId: 1, createdAt: -1 })
OrderSchema.index({ restaurantId: 1, 'payment.method': 1 })
OrderSchema.index({ restaurantId: 1, status: 1 })

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)

export default Order
