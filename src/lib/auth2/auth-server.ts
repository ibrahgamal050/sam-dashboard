import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"

const ACCESS_COOKIE = "mz.access"
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const ISSUER = process.env.NEXT_PUBLIC_ISSUER_URL!
const AUDIENCE = "meelza-clients"

export function getToken(req: NextRequest): string | null {
  const fromCookie = req.cookies.get(ACCESS_COOKIE)?.value
  if (fromCookie) return fromCookie

  const header = req.headers.get("authorization") || req.headers.get("Authorization")
  if (header?.startsWith("Bearer ")) return header.slice(7).trim()
  return null
}

export async function getAuth(
  req: NextRequest
): Promise<{ userId: string | null; payload: any | null }> {
  const token = getToken(req)
  if (!token) return { userId: null, payload: null }

  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTolerance: 5,
    })
    const userId = payload?.sub ? String(payload.sub) : null
    return { userId, payload }
  } catch (error) {
    console.warn("[auth-server] token verification failed", error)
    return { userId: null, payload: null }
  }
}
