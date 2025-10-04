import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import dbConnect from '@/lib/dbConnect'
import User, { type UserRole } from '@/models/User'
import { verifyAccessToken } from './token-service'
import { hasRequiredRole } from '@/server/security/rbac'
import { mapUserToSafe } from './mapper'
import type { AuthUser } from '@/lib/auth-client'

interface RequireAuthOptions {
  callbackUrl?: string
  requiredRoles?: UserRole[]
}

interface ServerSession {
  user: AuthUser
  sessionId: string
}

const LOGIN_ROUTE = '/auth/signin'

const serializeUser = (user: ReturnType<typeof mapUserToSafe>): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  roles: user.roles,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : undefined,
  securityProfile: {
    hardeningComplete: user.securityProfile.hardeningComplete,
    lastPasswordChangeAt: user.securityProfile.lastPasswordChangeAt
      ? user.securityProfile.lastPasswordChangeAt.toISOString()
      : undefined,
  },
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
})

const resolveCallbackUrl = (option?: string) => option ?? '/dashboard'

export async function requireServerAuth(options: RequireAuthOptions = {}): Promise<ServerSession> {
  const callbackUrl = resolveCallbackUrl(options.callbackUrl)
  const redirectToLogin = (): never => {
    const encoded = encodeURIComponent(callbackUrl)
    return redirect(`${LOGIN_ROUTE}?callbackUrl=${encoded}`)
  }

  const cookieStore = cookies()
  const accessToken = cookieStore.get('rms.access')?.value

  if (!accessToken) {
    return redirectToLogin()
  }

  try {
    await dbConnect()
    const decoded = verifyAccessToken(accessToken!)
    const user = await User.findById(decoded.sub)
    if (!user) {
      return redirectToLogin()
    }

    if (!user!.emailVerifiedAt || !user!.securityProfile.hardeningComplete || user!.status === 'DISABLED') {
      return redirectToLogin()
    }

    if (options.requiredRoles && options.requiredRoles.length) {
      if (!hasRequiredRole(user!.roles, options.requiredRoles)) {
        return redirectToLogin()
      }
    }

    const safeUser = mapUserToSafe(user!)
    return {
      user: serializeUser(safeUser),
      sessionId: decoded.sessionId,
    }
  } catch (error) {
    console.error('requireServerAuth failed', error)
    return redirectToLogin()
  }
}

export type { ServerSession }
