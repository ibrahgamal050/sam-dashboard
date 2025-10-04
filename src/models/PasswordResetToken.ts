import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId
  tokenHash: string
  expiresAt: Date
  consumedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
  },
  { timestamps: true }
)

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema)

export default PasswordResetToken
