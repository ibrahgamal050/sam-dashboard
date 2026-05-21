import { NextResponse } from 'next/server'
import { getLocalSessionUser } from '@/lib/auth/local-session'

export async function GET() {
  const user = await getLocalSessionUser()
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({ user })
}
