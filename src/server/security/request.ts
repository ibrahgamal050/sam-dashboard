import type { NextRequest } from 'next/server'

export const getClientIp = (req: NextRequest) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown'

export const getUserAgent = (req: NextRequest) => req.headers.get('user-agent') ?? undefined

export const buildRequestContext = (req: NextRequest, fingerprint?: string) => ({
  ipAddress: getClientIp(req),
  userAgent: getUserAgent(req),
  fingerprint,
})
