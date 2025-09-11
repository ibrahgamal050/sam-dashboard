import mongoose, { Schema, Document, Model } from 'mongoose'

export type KitchenItemState = 'queued' | 'cooking' | 'ready'

export interface IKitchenItem {
  itemId: mongoose.Types.ObjectId | string
  name: string
  qty: number
  state: KitchenItemState
  notes?: string
  routes?: string[] // stations
}

export interface IKitchenTicket extends Document {
  ticketId: string
  orderId: mongoose.Types.ObjectId | string
  restaurantId: mongoose.Types.ObjectId
  station: string // e.g., grill, fry, dessert, drinks
  items: IKitchenItem[]
  status: 'QUEUED' | 'COOKING' | 'READY'
  createdAt: Date
  promisedAt?: Date
  updatedAt: Date
}

const KitchenItemSchema = new Schema<IKitchenItem>(
  {
    itemId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    state: { type: String, enum: ['queued', 'cooking', 'ready'], default: 'queued' },
    notes: String,
    routes: [String],
  },
  { _id: true }
)

const KitchenTicketSchema = new Schema<IKitchenTicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, required: true },
    restaurantId: { type: Schema.Types.ObjectId, required: true, index: true },
    station: { type: String, required: true, index: true },
    items: { type: [KitchenItemSchema], required: true },
    status: { type: String, enum: ['QUEUED', 'COOKING', 'READY'], default: 'QUEUED', index: true },
    promisedAt: { type: Date },
  },
  { timestamps: true }
)

KitchenTicketSchema.index({ restaurantId: 1, station: 1, createdAt: -1 })

const KitchenTicket: Model<IKitchenTicket> =
  mongoose.models.KitchenTicket || mongoose.model<IKitchenTicket>('KitchenTicket', KitchenTicketSchema)

export default KitchenTicket

