import { NextResponse } from 'next/server'
import { registerSchema } from '@/server/validation/auth-schemas'
import { registerUser } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'

export const POST = withApiProtect(async ({ req }) => {
  try {
    const body = await req.json()
    const parsed = registerSchema.parse(body)

    await registerUser(parsed, buildRequestContext(req))

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Registration failed' }, { status: 400 })
  }
}, { allowUnauthenticated: true })
