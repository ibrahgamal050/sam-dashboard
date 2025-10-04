import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type AuditAction =
  | 'USER_REGISTERED'
  | 'USER_EMAIL_VERIFIED'
  | 'USER_SECURITY_ACTIVATED'
  | 'USER_LOGIN_SUCCESS'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'TOKEN_REFRESHED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PASSWORD_CHANGED'
  | 'PROFILE_UPDATED'
  | 'ACCOUNT_DISABLED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'

export interface IAuditLog extends Document {
  userId?: Types.ObjectId
  action: AuditAction
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
)

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

export default AuditLog
