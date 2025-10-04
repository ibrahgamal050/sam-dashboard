import { NextResponse } from 'next/server'
import { refreshSchema } from '@/server/validation/auth-schemas'
import { refreshTokens } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'
import { setAuthCookies } from '@/server/auth/cookie'
import { mapUserToSafe } from '@/server/auth/mapper'

export const POST = withApiProtect(async ({ req }) => {
  try {
    const body = await req.json().catch(() => ({}))
    const cookieRefresh = req.cookies.get('rms.refresh')?.value
    const parsed = refreshSchema.safeParse({ refreshToken: body.refreshToken ?? cookieRefresh })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 })
    }

    const { user, accessToken, refreshToken, session } = await refreshTokens(
      parsed.data.refreshToken,
      buildRequestContext(req)
    )

    const response = NextResponse.json({ ok: true, user: mapUserToSafe(user), sessionId: session.id })
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
    return NextResponse.json({ error: error.message ?? 'Failed to refresh session' }, { status: 400 })
  }
}, { allowUnauthenticated: true })
