import { NextResponse } from 'next/server'
import { logoutUser } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'
import { clearAuthCookies } from '@/server/auth/cookie'

export const POST = withApiProtect(async ({ req, auth }) => {
  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await logoutUser(auth.token.sessionId, buildRequestContext(req))
    const response = NextResponse.json({ ok: true })
    clearAuthCookies(response)
    response.cookies.delete('rms.csrf')
    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Logout failed' }, { status: 400 })
  }
})
