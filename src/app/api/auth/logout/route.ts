import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const ACCESS_COOKIE = process.env.JWT_COOKIE_NAME ?? "mz.access"
const REFRESH_COOKIE = "mz.refresh"
const LOGOUT_MARKER = "mz.logout"
const RETURN_COOKIE = "mz.return"

export async function POST() {
  const cookieStore = await cookies()
  const resp = NextResponse.json({ ok: true })

  const clear = (name: string) =>
    resp.cookies.set({
      name,
      value: "",
      maxAge: 0,
      path: "/",
    })

  clear(ACCESS_COOKIE)
  clear(REFRESH_COOKIE)
  clear(RETURN_COOKIE)

  // Mark that user intentionally logged out to avoid silent re-login
  resp.cookies.set({
    name: LOGOUT_MARKER,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  })

  // Also clear from request-side store for the current invocation
  cookieStore.set(ACCESS_COOKIE, "", { maxAge: 0, path: "/" })
  cookieStore.set(REFRESH_COOKIE, "", { maxAge: 0, path: "/" })
  cookieStore.set(RETURN_COOKIE, "", { maxAge: 0, path: "/" })
  cookieStore.set(LOGOUT_MARKER, "1", { maxAge: 5 * 60, path: "/" })

  return resp
}
