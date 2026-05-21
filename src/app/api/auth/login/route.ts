import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import dbConnect from '@/lib/dbConnect'
import { createLocalAccessToken, resolveSafeReturnUrl, setLocalSessionCookie } from "@/lib/auth/local-session"
import User from "@/models/User"
import { comparePassword } from "@/server/auth/password-service"

export const runtime = "nodejs"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  returnUrl: z.string().optional(),
})

const formatUserName = (name: unknown) => {
  if (typeof name === "string") return name
  if (name && typeof name === "object") {
    const first = typeof (name as { first?: unknown }).first === "string" ? (name as { first: string }).first : ""
    const last = typeof (name as { last?: unknown }).last === "string" ? (name as { last: string }).last : ""
    return [first, last].filter(Boolean).join(" ").trim() || undefined
  }
  return undefined
}

const resolveDashboardRole = (roles: unknown) => {
  if (!Array.isArray(roles)) return undefined
  const normalizedRoles = roles.map((role) => String(role).trim().toUpperCase())
  return normalizedRoles.some((role) => role === "ADMIN" || role === "SUPERADMIN") ? "meelza_admin" : undefined
}

const normalizeRoles = (roles: unknown) => {
  if (!Array.isArray(roles)) return []
  return roles.map((role) => String(role).trim()).filter(Boolean)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات تسجيل الدخول غير صحيحة" }, { status: 400 })
    }

    const email = parsed.data.email.trim().toLowerCase()
    await dbConnect()

    const user = await User.findOne({ email })
    if (!user?.passwordHash || !(await comparePassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "البريد الإلكتروني أو كلمة السر غير صحيحة" }, { status: 401 })
    }

    if (user.status === "DISABLED") {
      return NextResponse.json({ error: "هذا الحساب معطل" }, { status: 403 })
    }

    const userRoles = normalizeRoles(user.roles)
    const dashboardRole = resolveDashboardRole(userRoles)

    const token = await createLocalAccessToken({
      id: String(user._id),
      email: user.email,
      name: formatUserName(user.name),
      role: dashboardRole,
      roles: dashboardRole ? [dashboardRole] : userRoles,
    })

    const origin = req.nextUrl.origin
    const redirectTo = resolveSafeReturnUrl(parsed.data.returnUrl, origin)
    const response = NextResponse.json({ ok: true, redirectTo })
    setLocalSessionCookie(response, token)
    response.cookies.set("mz.logout", "", { maxAge: 0, path: "/" })
    response.cookies.set("mz.return", "", { maxAge: 0, path: "/" })
    return response
  } catch (error) {
    console.error("[auth] local login failed", error)
    return NextResponse.json({ error: "تعذّر تسجيل الدخول" }, { status: 500 })
  }
}
