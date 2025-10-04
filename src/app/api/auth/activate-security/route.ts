import { NextResponse } from 'next/server'
import { activateSecuritySchema } from '@/server/validation/auth-schemas'
import { activateSecurityChecklist } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'
import { mapUserToSafe } from '@/server/auth/mapper'

export const dynamic = 'force-dynamic'


export const POST = withApiProtect(async ({ req }) => {
  try {
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    const body = await req.json()
    const parsed = activateSecuritySchema.parse(body)
    const user = await activateSecurityChecklist(parsed.userId, buildRequestContext(req))
    return NextResponse.json({ ok: true, user: mapUserToSafe(user) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Activation failed' }, { status: 400 })
  }
}, { allowUnauthenticated: true })

export const GET = withApiProtect(async () => {
  return NextResponse.json({ ok: true })
}, { allowUnauthenticated: true, requireCsrf: false })
