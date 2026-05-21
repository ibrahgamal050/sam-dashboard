import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"

const ACCESS_COOKIE = "mz.access"
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const ISSUER = process.env.NEXT_PUBLIC_ISSUER_URL || "meelza-sites"
const AUDIENCE = "meelza-clients"

// استخرج التوكن من الكوكي أو Authorization
export function getToken(req: NextRequest) {
  const c = req.cookies.get(ACCESS_COOKIE)?.value
  if (c) return c
  const a = req.headers.get("authorization") || req.headers.get("Authorization")
  if (a?.startsWith("Bearer ")) return a.slice(7).trim()
  return null
}

// تحقّق وأرجع userId + payload (نحتاج payload لعمل upsert)
export async function getAuth(req: NextRequest): Promise<{ userId: string | null; payload: any | null }> {
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
  } catch {
    return { userId: null, payload: null }
  }
}
