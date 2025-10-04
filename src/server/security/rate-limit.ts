import rateLimit from 'express-rate-limit'
import type { Request } from 'express'
import { env } from '../env'

export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown'
    const user = (req as any).auth?.userId
    return user ? `${user}:${ip}` : ip
  },
})

type LoginAttemptKey = string

interface LoginAttemptState {
  attempts: number
  lastAttempt: number
  lockedUntil?: number
}

const loginAttemptStore = new Map<LoginAttemptKey, LoginAttemptState>()

const LOCK_THRESHOLD = 5
const LOCK_DURATION_MS = 5 * 60 * 1000
const DECAY_MS = 15 * 60 * 1000

const now = () => Date.now()

export const recordLoginFailure = (identifier: string): { locked: boolean; remaining: number; lockedUntil?: number } => {
  const key = identifier.toLowerCase()
  const state = loginAttemptStore.get(key) ?? { attempts: 0, lastAttempt: 0 }
  const currentTime = now()

  if (state.lockedUntil && state.lockedUntil > currentTime) {
    return { locked: true, remaining: 0, lockedUntil: state.lockedUntil }
  }

  if (state.lastAttempt < currentTime - DECAY_MS) {
    state.attempts = 0
  }

  state.attempts += 1
  state.lastAttempt = currentTime

  if (state.attempts >= LOCK_THRESHOLD) {
    state.lockedUntil = currentTime + LOCK_DURATION_MS
  }

  loginAttemptStore.set(key, state)

  const remaining = Math.max(LOCK_THRESHOLD - state.attempts, 0)
  return { locked: Boolean(state.lockedUntil && state.lockedUntil > currentTime), remaining, lockedUntil: state.lockedUntil }
}

export const resetLoginFailures = (identifier: string) => {
  loginAttemptStore.delete(identifier.toLowerCase())
}

export const isIdentifierLocked = (identifier: string): { locked: boolean; lockedUntil?: number } => {
  const state = loginAttemptStore.get(identifier.toLowerCase())
  if (!state?.lockedUntil) return { locked: false }
  if (state.lockedUntil < now()) {
    loginAttemptStore.delete(identifier.toLowerCase())
    return { locked: false }
  }
  return { locked: true, lockedUntil: state.lockedUntil }
}
