import { NextResponse } from 'next/server'
import { resetPasswordSchema } from '@/server/validation/auth-schemas'
import { resetPassword } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'

export const POST = withApiProtect(async ({ req }) => {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.parse(body)
    await resetPassword(parsed.token, parsed.password, buildRequestContext(req))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Reset failed' }, { status: 400 })
  }
}, { allowUnauthenticated: true })
