import mongoose, { Schema, Document, Model } from 'mongoose'

export type EmployeeRole = 'manager' | 'cashier' | 'waiter' | 'expo' | 'kitchen'

export interface IEmployee extends Document {
  restaurantId: mongoose.Types.ObjectId
  name: string
  role: EmployeeRole
  pinHash: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    restaurantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['manager','cashier','waiter','expo','kitchen'], required: true, index: true },
    pinHash: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

EmployeeSchema.index({ restaurantId: 1, role: 1, name: 1 })

const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema)

export default Employee

