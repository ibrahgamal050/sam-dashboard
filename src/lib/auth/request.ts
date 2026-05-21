import type { NextRequest } from "next/server"
import { verifyAccessToken } from "./jwt"

/** اسم الكوكي المستخدم لتخزين Access Token */
export const ACCESS_COOKIE = "mz.access"

/** يستخرج التوكن من Cookie أو Authorization header */
export function getTokenFromRequest(req: NextRequest): string | null {
  // 1) كوكي
  const fromCookie = req.cookies.get(ACCESS_COOKIE)?.value
  if (fromCookie) return fromCookie

  // 2) Authorization: Bearer ...
  const auth = req.headers.get("authorization") || req.headers.get("Authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim()

  return null
}

/** يعيد userId والـ payload لو التوكن صالح؛ وإلا null */
export async function getAuthFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return { userId: null, payload: null }

  const payload = await verifyAccessToken(token)
  const userId = payload?.sub ? String(payload.sub) : null
  return { userId, payload }
}
