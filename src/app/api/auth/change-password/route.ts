import { NextResponse } from 'next/server'
import { changePasswordSchema } from '@/server/validation/auth-schemas'
import { changePassword } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function HEAD() {
  return new NextResponse(null, { status: 204 })
}

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
