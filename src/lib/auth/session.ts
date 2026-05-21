import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const ACCESS_COOKIE = "mz.access"
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const ISSUER = process.env.NEXT_PUBLIC_ISSUER_URL || "meelza-sites"
const AUDIENCE = "meelza-clients"

type SessionUser = {
  sub: string; email?: string; name?: string; picture?: string; email_verified?: boolean
}

export type SessionResult =
  | { status: "authenticated"; user: SessionUser }
  | { status: "unauthenticated" }

function getTokenFromReq(req: NextRequest) {
  const c = req.cookies.get(ACCESS_COOKIE)?.value
  if (c) return c
  const a = req.headers.get("authorization") || req.headers.get("Authorization")
  if (a?.startsWith("Bearer ")) return a.slice(7).trim()
  return null
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionResult> {
  const token = getTokenFromReq(req)
  if (!token) return { status: "unauthenticated" }
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: ISSUER, audience: AUDIENCE, clockTolerance: 5 })
    return {
      status: "authenticated",
      user: {
        sub: String(payload.sub),
        email: payload.email as string | undefined,
        name: payload.name as string | undefined,
        picture: payload.picture as string | undefined,
        email_verified: Boolean(payload.email_verified),
      },
    }
  } catch {
    return { status: "unauthenticated" }
  }
}
