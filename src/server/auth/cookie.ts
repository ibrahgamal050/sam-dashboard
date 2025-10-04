import type { NextResponse } from 'next/server'

const isProd = process.env.NODE_ENV === 'production'

export const setAuthCookies = (res: NextResponse, tokens: { accessToken: string; refreshToken: string }) => {
  res.cookies.set('rms.access', tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60,
  })

  res.cookies.set('rms.refresh', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export const clearAuthCookies = (res: NextResponse) => {
  res.cookies.set('rms.access', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  res.cookies.set('rms.refresh', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}
