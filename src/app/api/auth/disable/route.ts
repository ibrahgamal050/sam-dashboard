import { NextResponse } from 'next/server'
import { disableAccountSchema } from '@/server/validation/auth-schemas'
import { disableAccount } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'

export const POST = withApiProtect(async ({ req, auth }) => {
  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = disableAccountSchema.parse(body)
    await disableAccount(auth.user.id, parsed.reason, buildRequestContext(req))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to disable account' }, { status: 400 })
  }
}, { requiredRoles: ['USER'] })
