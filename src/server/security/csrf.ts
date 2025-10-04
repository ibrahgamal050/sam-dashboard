import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { env } from '../env'

const CSRF_COOKIE_NAME = 'rms.csrf'

const signToken = (token: string) =>
  crypto
    .createHmac('sha256', env.csrfSecret)
    .update(token)
    .digest('hex')

export const createCsrfToken = () => {
  const raw = crypto.randomBytes(32).toString('hex')
  const signature = signToken(raw)
  return `${raw}.${signature}`
}

export const verifyCsrfToken = (token: string | undefined) => {
  if (!token) return false
  const [raw, signature] = token.split('.')
  if (!raw || !signature) return false
  const expected = signToken(raw)
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]
  if (!cookieToken) {
    const token = createCsrfToken()
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
    res.locals.csrfToken = token
    return next()
  }

  res.locals.csrfToken = cookieToken

  const method = req.method?.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method || '')) {
    return next()
  }

  const headerToken = req.get('x-csrf-token')
  if (!headerToken || !verifyCsrfToken(headerToken) || headerToken !== cookieToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }

  return next()
}

export const attachCsrfHeader = (res: Response) => {
  if (res.locals.csrfToken) {
    res.setHeader('x-csrf-token', res.locals.csrfToken)
  }
}

export const getCsrfCookieName = () => CSRF_COOKIE_NAME
