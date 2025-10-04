import { NextResponse } from 'next/server'
import { updateProfileSchema } from '@/server/validation/auth-schemas'
import { updateProfile } from '@/server/auth/auth-service'
import { withApiProtect } from '@/server/security/with-api-protect'
import { buildRequestContext } from '@/server/security/request'
import { mapUserToSafe } from '@/server/auth/mapper'

export const PATCH = withApiProtect(async ({ req, auth }) => {
  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = updateProfileSchema.parse(body)
    const user = await updateProfile(auth.user.id, parsed, buildRequestContext(req))
    return NextResponse.json({ ok: true, user: mapUserToSafe(user) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Update failed' }, { status: 400 })
  }
}, { requiredRoles: ['USER'] })
