import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ISessionToken extends Document {
  userId: Types.ObjectId
  refreshTokenHash: string
  csrfToken: string
  userAgent?: string
  ipAddress?: string
  fingerprint?: string
  rotationCounter: number
  expiresAt: Date
  revokedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const SessionTokenSchema = new Schema<ISessionToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    csrfToken: { type: String, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    fingerprint: { type: String },
    rotationCounter: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
  },
  { timestamps: true }
)

SessionTokenSchema.index({ userId: 1, refreshTokenHash: 1 })
SessionTokenSchema.index({ csrfToken: 1 })

const SessionToken: Model<ISessionToken> =
  mongoose.models.SessionToken || mongoose.model<ISessionToken>('SessionToken', SessionTokenSchema)

export default SessionToken
