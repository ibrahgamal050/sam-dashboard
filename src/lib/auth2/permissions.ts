import { createHmac, timingSafeEqual } from "crypto"

const BEARER_PREFIX = "bearer "

export type RestaurantAdminSession = {
  sub: string
  roles: string[]
  restaurantIds: string[]
}

export type AuthorizationResult =
  | { ok: true; session: RestaurantAdminSession }
  | { ok: false; status: number; message: string }

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const lower = header.toLowerCase()
  if (!lower.startsWith(BEARER_PREFIX)) return null
  return header.substring(BEARER_PREFIX.length)
}

export function verifyJwt(token: string, secret: string): RestaurantAdminSession | null {
  const segments = token.split(".")
  if (segments.length !== 3) return null
  const [encodedHeader, encodedPayload, signature] = segments
  const data = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = createHmac("sha256", secret).update(data).digest("base64")

  const normalized = expectedSignature.replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_")
  const provided = signature.replace(/=+$/g, "")

  if (!constantTimeEquals(normalized, provided)) {
    return null
  }

  try {
    const payloadJson = Buffer.from(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    const payload = JSON.parse(payloadJson)

    const roles = Array.isArray(payload.roles)
      ? payload.roles.map(String)
      : typeof payload.role === "string"
        ? [payload.role]
        : []
    const restaurantIds = Array.isArray(payload.restaurantIds)
      ? payload.restaurantIds.map(String)
      : typeof payload.restaurantId === "string"
        ? [payload.restaurantId]
        : []

    return {
      sub: String(payload.sub ?? payload.userId ?? ""),
      roles,
      restaurantIds,
    }
  } catch (error) {
    console.error("Failed to decode auth token", error)
    return null
  }
}

export function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export function requireRestaurantAdmin(request: Request, restaurantId: string): AuthorizationResult {
  const token = extractBearerToken(request)
  if (!token) {
    return { ok: false, status: 401, message: "Missing authorization token" }
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    return { ok: false, status: 500, message: "Auth secret is not configured" }
  }

  const session = verifyJwt(token, secret)
  if (!session) {
    return { ok: false, status: 401, message: "Invalid token" }
  }

  if (!session.roles.includes("restaurant:admin")) {
    return { ok: false, status: 403, message: "Insufficient permissions" }
  }

  if (restaurantId && !session.restaurantIds.includes(String(restaurantId))) {
    return { ok: false, status: 403, message: "Forbidden for this restaurant" }
  }

  return { ok: true, session }
}
