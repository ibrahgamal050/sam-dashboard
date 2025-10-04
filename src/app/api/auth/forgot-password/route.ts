import { NextResponse } from 'next/server'
import { forgotPasswordSchema } from '@/server/validation/auth-schemas'
import { requestPasswordReset } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'

export const POST = withApiProtect(async ({ req }) => {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.parse(body)
    await requestPasswordReset(parsed.email, buildRequestContext(req))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to start reset' }, { status: 400 })
  }
}, { allowUnauthenticated: true })
