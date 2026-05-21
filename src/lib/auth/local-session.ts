import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import type { NextResponse } from "next/server"

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "mz.access"
const ISSUER = process.env.NEXT_PUBLIC_ISSUER_URL || "meelza-sites"
const AUDIENCE = process.env.JWT_AUDIENCE ?? "meelza-clients"
const MAX_AGE = 60 * 60 * 24 * 30

export type LocalSessionUser = {
  id: string
  email?: string
  name?: string
  picture?: string
  role?: string
  roles?: unknown[]
  roleAssignments?: unknown[]
  restaurantId?: string | null
  supermarketId?: string | null
  brandId?: string | null
}

const toPlainJson = (value: unknown): unknown => {
  if (value == null) return undefined
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) {
    return value
      .map((entry) => toPlainJson(entry))
      .filter((entry) => entry !== undefined)
  }
  if (typeof value === "object") {
    const source =
      typeof (value as { toObject?: () => unknown }).toObject === "function"
        ? (value as { toObject: () => unknown }).toObject()
        : value
    const output: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(source as Record<string, unknown>)) {
      const next = toPlainJson(entry)
      if (next !== undefined) output[key] = next
    }
    return output
  }
  return undefined
}

export async function createLocalAccessToken(user: LocalSessionUser) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")

  const payload: Record<string, unknown> = {
    auth_provider: "local",
    email_verified: Boolean(user.email),
  }
  if (user.email) payload.email = user.email
  if (user.name) payload.name = user.name
  if (user.picture) payload.picture = user.picture
  if (user.role) payload.role = user.role
  if (user.roles) payload.roles = toPlainJson(user.roles)
  if (user.roleAssignments) payload.roleAssignments = toPlainJson(user.roleAssignments)
  if (user.restaurantId) payload.restaurantId = user.restaurantId
  if (user.supermarketId) payload.supermarketId = user.supermarketId
  if (user.brandId) payload.brandId = user.brandId

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(new TextEncoder().encode(secret))
}

export function setLocalSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function getLocalSessionUser(): Promise<LocalSessionUser | null> {
  const secret = process.env.JWT_SECRET
  if (!secret) return null

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTolerance: 5,
    })

    const sub = payload.sub ? String(payload.sub) : ""
    if (!sub) return null

    return {
      id: sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
      roles: Array.isArray(payload.roles) ? payload.roles : undefined,
      roleAssignments: Array.isArray(payload.roleAssignments) ? payload.roleAssignments : undefined,
      restaurantId: typeof payload.restaurantId === "string" ? payload.restaurantId : null,
      supermarketId: typeof payload.supermarketId === "string" ? payload.supermarketId : null,
      brandId: typeof payload.brandId === "string" ? payload.brandId : null,
    }
  } catch {
    return null
  }
}

export function resolveSafeReturnUrl(raw: string | null | undefined, origin: string) {
  if (!raw) return "/"
  try {
    if (raw.startsWith("/")) return raw.startsWith("//") ? "/" : raw
    const parsed = new URL(raw, origin)
    if (parsed.origin === origin) return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return "/"
  }
  return "/"
}
