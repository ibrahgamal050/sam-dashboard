import { NextRequest, NextResponse } from 'next/server'
import { createCsrfToken, verifyCsrfToken, getCsrfCookieName } from '@/server/security/csrf'

export async function GET(req: NextRequest) {
  const cookieValue = req.cookies.get(getCsrfCookieName())?.value
  let token = cookieValue

  if (!token || !verifyCsrfToken(token)) {
    token = createCsrfToken()
  }

  const response = NextResponse.json({ csrfToken: token })
  response.cookies.set(getCsrfCookieName(), token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
  response.headers.set('x-csrf-token', token)
  return response
}
