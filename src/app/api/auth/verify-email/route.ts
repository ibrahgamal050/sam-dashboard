import { NextResponse } from 'next/server'
import { verifyEmailSchema } from '@/server/validation/auth-schemas'
import { verifyEmail } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'
import { mapUserToSafe } from '@/server/auth/mapper'

export const POST = withApiProtect(async ({ req }) => {
  try {
    const body = await req.json()
    const { token } = verifyEmailSchema.parse(body)
    const user = await verifyEmail(token, buildRequestContext(req))
    return NextResponse.json({ ok: true, user: mapUserToSafe(user) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Verification failed' }, { status: 400 })
  }
}, { allowUnauthenticated: true })
