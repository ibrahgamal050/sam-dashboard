import mongoose, { Schema, Document, Model } from 'mongoose'

export type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN'

export type UserStatus =
  | 'PENDING_EMAIL'
  | 'SECURITY_CHECKLIST_REQUIRED'
  | 'READY'
  | 'DISABLED'

export interface SecurityProfile {
  hardeningComplete: boolean
  lastPasswordChangeAt?: Date
  failedLoginAttempts: number
  lockedUntil?: Date
}

export interface IUser extends Document {
  name: {
    first: string
    last: string
  }
  email: string
  passwordHash: string
  roles: UserRole[]
  status: UserStatus
  emailVerifiedAt?: Date
  disabledAt?: Date
  securityProfile: SecurityProfile
  createdAt: Date
  updatedAt: Date
}

const SecurityProfileSchema = new Schema<SecurityProfile>(
  {
    hardeningComplete: { type: Boolean, default: false },
    lastPasswordChangeAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    name: {
      first: { type: String, required: true, trim: true },
      last: { type: String, required: true, trim: true },
    },
    email: { type: String, required: true, lowercase: true, unique: true, index: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: {
      type: [String],
      enum: ['USER', 'ADMIN', 'SUPERADMIN'],
      default: ['USER'],
    },
    status: {
      type: String,
      enum: ['PENDING_EMAIL', 'SECURITY_CHECKLIST_REQUIRED', 'READY', 'DISABLED'],
      default: 'PENDING_EMAIL',
      index: true,
    },
    emailVerifiedAt: { type: Date },
    disabledAt: { type: Date },
    securityProfile: { type: SecurityProfileSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
