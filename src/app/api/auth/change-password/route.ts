import { NextResponse } from 'next/server'
import { changePasswordSchema } from '@/server/validation/auth-schemas'
import { changePassword } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'

export const dynamic = 'force-dynamic'

export const GET = withApiProtect(async () => NextResponse.json({ ok: true }), {
  allowUnauthenticated: true,
  requireCsrf: false,
})

export const HEAD = withApiProtect(async () => new NextResponse(null, { status: 204 }), {
  allowUnauthenticated: true,
  requireCsrf: false,
})

export const POST = withApiProtect(async ({ req, auth }) => {
  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = changePasswordSchema.parse(body)
    await changePassword(auth.user.id, parsed.currentPassword, parsed.newPassword, buildRequestContext(req))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to change password' }, { status: 400 })
  }
}, { requiredRoles: ['USER'] })
