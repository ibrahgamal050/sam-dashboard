import crypto from 'node:crypto'
import dbConnect from '@/lib/dbConnect'
import User, { type IUser } from '@/models/User'
import EmailVerificationToken from '@/models/EmailVerificationToken'
import PasswordResetToken from '@/models/PasswordResetToken'
import { hashPassword, comparePassword } from './password-service'
import { logAuditEvent } from '../security/audit'
import { resetLoginFailures, recordLoginFailure, isIdentifierLocked } from '../security/rate-limit'
import { sendEmail } from '../email/send'

interface RequestContext {
  ipAddress?: string
  userAgent?: string
  fingerprint?: string
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

const generateToken = () => crypto.randomBytes(40).toString('hex')

const stringifyObjectId = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value && typeof (value as { toString?: () => string }).toString === 'function') {
    return (value as { toString: () => string }).toString()
  }
  return ''
}

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

export const userCannotLogin = (user: IUser) => {
  if (user.status === 'DISABLED') return 'Account disabled'
  if (!user.emailVerifiedAt) return 'Email not verified'
  if (!user.securityProfile.hardeningComplete) return 'Security checklist incomplete'
  if (user.securityProfile.lockedUntil && user.securityProfile.lockedUntil > new Date()) {
    return 'Account temporarily locked'
  }
  return null
}

export async function authenticateUserCredentials(
  email: string,
  password: string,
  context: RequestContext
): Promise<IUser> {
  await dbConnect()
  const normalizedEmail = email.toLowerCase()

  const { locked, lockedUntil } = isIdentifierLocked(normalizedEmail)
  if (locked) {
    throw new Error(`Too many attempts. Try again after ${new Date(lockedUntil!).toISOString()}`)
  }

  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    recordLoginFailure(normalizedEmail)
    await logAuditEvent({
      action: 'USER_LOGIN_FAILED',
      metadata: { reason: 'USER_NOT_FOUND', email },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })
    throw new Error('Invalid credentials')
  }

  if (user.status === 'DISABLED') {
    await logAuditEvent({
      userId: stringifyObjectId(user._id),
      action: 'USER_LOGIN_FAILED',
      metadata: { reason: 'ACCOUNT_DISABLED' },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })
    throw new Error('Account disabled')
  }

  if (typeof user.passwordHash !== 'string' || !user.passwordHash) {
    await logAuditEvent({
      userId: stringifyObjectId(user._id),
      action: 'USER_LOGIN_FAILED',
      metadata: { reason: 'PASSWORD_NOT_SET' },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })
    throw new Error('Account password not configured')
  }

  const passwordOk = await comparePassword(password, user.passwordHash)
  if (!passwordOk) {
    const { locked: nowLocked, remaining, lockedUntil: lockTime } = recordLoginFailure(normalizedEmail)
    await logAuditEvent({
      userId: stringifyObjectId(user._id),
      action: 'USER_LOGIN_FAILED',
      metadata: { reason: 'INVALID_PASSWORD', remainingAttempts: remaining, lockUntil: lockTime },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })
    throw new Error(nowLocked ? 'Account temporarily locked due to failures' : 'Invalid credentials')
  }

  resetLoginFailures(normalizedEmail)

  const blocker = userCannotLogin(user)
  if (blocker) {
    throw new Error(blocker)
  }

  return user
}

export async function registerUser(
  data: { firstName: string; lastName: string; email: string; password: string },
  context: RequestContext
) {
  await dbConnect()
  const existing = await User.findOne({ email: data.email.toLowerCase() })
  if (existing) {
    throw new Error('Email already in use')
  }

  const passwordHash = await hashPassword(data.password)

  const user = await User.create({
    name: { first: data.firstName, last: data.lastName },
    email: data.email.toLowerCase(),
    passwordHash,
    status: 'PENDING_EMAIL',
    securityProfile: { hardeningComplete: false, failedLoginAttempts: 0 },
  })

  const verificationToken = generateToken()
  await EmailVerificationToken.create({
    userId: user._id,
    tokenHash: hashToken(verificationToken),
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
  })

  await sendEmail({
    to: data.email,
    subject: 'Verify your Meelza RMS account',
    html: `<p>Hi ${data.firstName},</p><p>Use this token to verify your email: <strong>${verificationToken}</strong></p>`,
  })

  await logAuditEvent({
    userId: stringifyObjectId(user._id),
    action: 'USER_REGISTERED',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })

  return user
}

export async function verifyEmail(token: string, context: RequestContext) {
  await dbConnect()
  const tokenHash = hashToken(token)
  const record = await EmailVerificationToken.findOne({ tokenHash })
  if (!record) {
    throw new Error('Invalid or expired verification token')
  }
  if (record.consumedAt) {
    throw new Error('Token already used')
  }
  if (record.expiresAt < new Date()) {
    throw new Error('Verification token expired')
  }

  const user = await User.findById(record.userId)
  if (!user) {
    throw new Error('User not found for token')
  }

  user.emailVerifiedAt = new Date()
  user.status = user.securityProfile.hardeningComplete ? 'READY' : 'SECURITY_CHECKLIST_REQUIRED'
  await user.save()

  record.consumedAt = new Date()
  await record.save()

  await logAuditEvent({
    userId: stringifyObjectId(user._id),
    action: 'USER_EMAIL_VERIFIED',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })

  return user
}

export async function activateSecurityChecklist(userId: string, context: RequestContext) {
  await dbConnect()
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  user.securityProfile.hardeningComplete = true
  if (user.emailVerifiedAt) {
    user.status = 'READY'
  } else {
    user.status = 'SECURITY_CHECKLIST_REQUIRED'
  }
  await user.save()

  await logAuditEvent({
    userId: stringifyObjectId(user._id),
    action: 'USER_SECURITY_ACTIVATED',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })

  return user
}

export async function requestPasswordReset(email: string, context: RequestContext) {
  await dbConnect()
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    return
  }

  const token = generateToken()
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  })

  await sendEmail({
    to: user.email,
    subject: 'Reset your Meelza RMS password',
    html: `<p>Use this token to reset your password: <strong>${token}</strong></p>`,
  })

  await logAuditEvent({
    userId: stringifyObjectId(user._id),
    action: 'PASSWORD_RESET_REQUESTED',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })
}

export async function resetPassword(token: string, newPassword: string, context: RequestContext) {
  await dbConnect()
  const tokenHash = hashToken(token)
  const record = await PasswordResetToken.findOne({ tokenHash })
  if (!record || record.expiresAt < new Date() || record.consumedAt) {
    throw new Error('Invalid reset token')
  }

  const user = await User.findById(record.userId)
  if (!user) throw new Error('User not found')

  user.passwordHash = await hashPassword(newPassword)
  user.securityProfile.lastPasswordChangeAt = new Date()
  await user.save()

  record.consumedAt = new Date()
  await record.save()

  await logAuditEvent({
    userId: stringifyObjectId(user._id),
    action: 'PASSWORD_RESET_COMPLETED',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  context: RequestContext
) {
  await dbConnect()
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  const matches = await comparePassword(currentPassword, user.passwordHash)
  if (!matches) {
    throw new Error('Current password incorrect')
  }

  user.passwordHash = await hashPassword(newPassword)
  user.securityProfile.lastPasswordChangeAt = new Date()
  await user.save()

  await logAuditEvent({
    userId: stringifyObjectId(user._id),
    action: 'PASSWORD_CHANGED',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })
}

export async function updateProfile(userId: string, updates: { firstName?: string; lastName?: string }, context: RequestContext) {
  await dbConnect()
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  if (updates.firstName) user.name.first = updates.firstName
  if (updates.lastName) user.name.last = updates.lastName
  await user.save()

  await logAuditEvent({
    userId: stringifyObjectId(user._id),
    action: 'PROFILE_UPDATED',
    metadata: updates,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })

  return user
}

export async function disableAccount(userId: string, reason: string | undefined, context: RequestContext) {
  await dbConnect()
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')
  user.status = 'DISABLED'
  user.disabledAt = new Date()
  await user.save()

  await logAuditEvent({
    userId: stringifyObjectId(user._id),
    action: 'ACCOUNT_DISABLED',
    metadata: { reason },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })
}
