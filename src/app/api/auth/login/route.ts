import { NextResponse } from 'next/server'
import { loginSchema } from '@/server/validation/auth-schemas'
import { loginUser } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'
import { setAuthCookies } from '@/server/auth/cookie'
import { mapUserToSafe } from '@/server/auth/mapper'

export const POST = withApiProtect(async ({ req }) => {
  try {
    const body = await req.json()
    const parsed = loginSchema.parse(body)

    const { user, accessToken, refreshToken, session } = await loginUser(
      parsed.email,
      parsed.password,
      buildRequestContext(req, parsed.fingerprint)
    )

    const response = NextResponse.json({
      ok: true,
      user: mapUserToSafe(user),
      sessionId: session.id,
    })

    setAuthCookies(response, { accessToken, refreshToken })
    response.cookies.set('rms.csrf', session.csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
    response.headers.set('x-csrf-token', session.csrfToken)

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Login failed' }, { status: 400 })
  }
}, { allowUnauthenticated: true, requireCsrf: false })
