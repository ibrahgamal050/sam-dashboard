import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IEmailVerificationToken extends Document {
  userId: Types.ObjectId
  tokenHash: string
  expiresAt: Date
  consumedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
  },
  { timestamps: true }
)

EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const EmailVerificationToken: Model<IEmailVerificationToken> =
  mongoose.models.EmailVerificationToken ||
  mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema)

export default EmailVerificationToken
