import { jwtVerify, type JWTPayload } from "jose"

/** إعدادات أساسية */
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const ISS = process.env.NEXT_PUBLIC_ISSUER_URL || "meelza-sites"
const AUD = "meelza-clients"                         // نفس القيمة اللي أنت موقّع بيها

export type AccessPayload = JWTPayload & {
  scope?: string
  email?: string
  name?: string
  picture?: string
  email_verified?: boolean
}

/** يتحقق من التوكن (HS256) ويعيد الـ payload لو صالح */
export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISS,
      audience: AUD,
      clockTolerance: 5,
    })
    return payload as AccessPayload
  } catch {
    return null
  }
}
