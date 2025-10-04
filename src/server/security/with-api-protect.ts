import { NextResponse, type NextRequest } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User, { type IUser, type UserRole } from '@/models/User'
import { verifyAccessToken } from '../auth/token-service'
import { hasRequiredRole } from './rbac'
import { verifyCsrfToken, getCsrfCookieName } from './csrf'

interface AuthenticatedRequest {
  user: IUser
  token: {
    sub: string
    roles: string[]
    sessionId: string
  }
}

interface ApiProtectOptions {
  allowUnauthenticated?: boolean
  requiredRoles?: UserRole[]
  requireCsrf?: boolean
}

interface HandlerContext {
  req: NextRequest
  auth?: AuthenticatedRequest
}

type Handler = (context: HandlerContext) => Promise<NextResponse>

export function withApiProtect(handler: Handler, options: ApiProtectOptions = {}) {
  return async function protectedHandler(req: NextRequest): Promise<NextResponse> {
    const { allowUnauthenticated = false, requiredRoles = [], requireCsrf = true } = options

    let auth: AuthenticatedRequest | undefined

    const method = req.method.toUpperCase()
    const needsCsrf = requireCsrf && !['GET', 'HEAD', 'OPTIONS'].includes(method)
    if (needsCsrf) {
      const csrfHeader = req.headers.get('x-csrf-token') || undefined
      const csrfCookie = req.cookies.get(getCsrfCookieName())?.value
      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie || !verifyCsrfToken(csrfHeader)) {
        return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
      }
    }

    await dbConnect()

    const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const cookieToken = req.cookies.get('rms.access')?.value
    const tokenCandidate = bearer || cookieToken

    if (tokenCandidate) {
      try {
        const decoded = verifyAccessToken(tokenCandidate)
        const user = await User.findById(decoded.sub)
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 401 })
        }
        auth = {
          user,
          token: {
            sub: decoded.sub,
            roles: decoded.roles,
            sessionId: decoded.sessionId,
          },
        }
      } catch (error) {
        if (!allowUnauthenticated) {
          return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
        }
      }
    }

    if (!auth && !allowUnauthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (requiredRoles.length && auth) {
      if (!hasRequiredRole(auth.user.roles, requiredRoles)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    return handler({ req, auth })
  }
}
