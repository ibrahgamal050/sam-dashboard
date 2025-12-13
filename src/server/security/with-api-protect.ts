import { NextResponse, type NextRequest } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User, { type IUser, type UserRole } from '@/models/User'
import { hasRequiredRole } from './rbac'
import { verifyCsrfToken, getCsrfCookieName } from './csrf'
import { userCannotLogin } from '../auth/auth-service'
import { getAuth } from '@/lib/auth/auth-server'

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

    const { userId, payload } = await getAuth(req)
    if (userId) {
      await dbConnect()
      const user = await User.findById(userId)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }

      const blocker = userCannotLogin(user)
      if (blocker) {
        return NextResponse.json({ error: blocker }, { status: 403 })
      }

      const rolesFromPayload =
        Array.isArray((payload as any)?.roles) && (payload as any).roles.length
          ? ((payload as any).roles as IUser['roles'])
          : undefined

      const sessionId =
        (payload?.sid as string) ??
        (payload?.sessionId as string) ??
        (payload?.session_id as string) ??
        'n/a'

      auth = {
        user,
        token: {
          sub: userId,
          roles: rolesFromPayload ?? user.roles,
          sessionId,
        },
      }
    } else if (!allowUnauthenticated) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
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
