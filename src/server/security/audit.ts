import AuditLog, { type AuditAction } from '@/models/AuditLog'
import type { Types } from 'mongoose'

interface AuditOptions {
  userId?: Types.ObjectId | string
  action: AuditAction
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function logAuditEvent({ userId, action, ipAddress, userAgent, metadata }: AuditOptions) {
  try {
    await AuditLog.create({ userId, action, ipAddress, userAgent, metadata })
  } catch (error) {
    console.error('Failed to log audit event', error)
  }
}
