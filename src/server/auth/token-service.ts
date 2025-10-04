import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { IUser } from '@/models/User'
import SessionToken, { type ISessionToken } from '@/models/SessionToken'
import { env } from '../env'

interface TokenContext {
  userAgent?: string
  ipAddress?: string
  fingerprint?: string
}

interface JwtContent {
  sub: string
  roles: string[]
  sessionId: string
  type: 'access' | 'refresh'
}

interface IssuedTokens {
  accessToken: string
  refreshToken: string
  csrfToken: string
  session: ISessionToken
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

const parseDurationToSeconds = (value: string) => {
  const trimmed = value.trim()
  const simple = Number.parseInt(trimmed, 10)
  if (Number.isFinite(simple)) return simple

  const match = trimmed.match(/^(\d+)([smhd])$/)
  if (!match) {
    throw new Error(`Invalid duration format: ${value}`)
  }

  const amount = Number.parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 's':
      return amount
    case 'm':
      return amount * 60
    case 'h':
      return amount * 60 * 60
    case 'd':
      return amount * 60 * 60 * 24
    default:
      throw new Error(`Unsupported duration unit: ${unit}`)
  }
}

const createJwt = (payload: JwtContent, secret: string, expiresIn: string) => {
  const expiresInSeconds = parseDurationToSeconds(expiresIn)

  return jwt.sign(payload, secret, {
    expiresIn: expiresInSeconds,
    issuer: env.jwtIssuer,
  })
}

export const verifyAccessToken = (token: string): JwtContent => {
  const decoded = jwt.verify(token, env.jwtAccessSecret, { issuer: env.jwtIssuer }) as JwtContent
  return decoded
}

export const verifyRefreshToken = (token: string): JwtContent => {
  const decoded = jwt.verify(token, env.jwtRefreshSecret, { issuer: env.jwtIssuer }) as JwtContent
  return decoded
}

const createCsrfToken = () => crypto.randomBytes(20).toString('hex')

export async function issueNewSession(user: IUser, context: TokenContext): Promise<IssuedTokens> {
  const session = new SessionToken({
    userId: user._id,
    csrfToken: createCsrfToken(),
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
    fingerprint: context.fingerprint,
    rotationCounter: 0,
    expiresAt: new Date(Date.now() + parseDurationToSeconds(env.refreshTokenExpiresIn) * 1000),
  })

  const payload: JwtContent = {
    sub: user.id,
    roles: user.roles,
    sessionId: session.id,
    type: 'access',
  }

  const accessToken = createJwt(payload, env.jwtAccessSecret, env.authTokenExpiresIn)

  const refreshPayload: JwtContent = {
    ...payload,
    type: 'refresh',
  }
  const refreshToken = createJwt(refreshPayload, env.jwtRefreshSecret, env.refreshTokenExpiresIn)

  session.refreshTokenHash = hashToken(refreshToken)
  await session.save()

  return { accessToken, refreshToken, csrfToken: session.csrfToken, session }
}

export async function rotateSession(
  session: ISessionToken,
  user: IUser,
  currentRefreshToken: string,
  context: TokenContext
): Promise<IssuedTokens> {
  if (session.revokedAt) {
    throw new Error('Session revoked')
  }

  if (session.expiresAt < new Date()) {
    throw new Error('Session expired')
  }

  const currentHash = hashToken(currentRefreshToken)
  if (session.refreshTokenHash !== currentHash) {
    throw new Error('Refresh token mismatch')
  }

  session.revokedAt = new Date()
  await session.save()

  return issueNewSession(user, context)
}

export async function revokeSession(sessionId: string) {
  await SessionToken.findByIdAndUpdate(sessionId, { revokedAt: new Date() })
}

export async function findSessionById(sessionId: string) {
  return SessionToken.findById(sessionId)
}

export { hashToken }
