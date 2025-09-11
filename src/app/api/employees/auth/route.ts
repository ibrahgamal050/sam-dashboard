import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Employee from '@/models/Employee'
import crypto from 'crypto'

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(`pospin:${pin}`).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { restaurantId, pin } = await req.json()
    if (!restaurantId || !pin) return NextResponse.json({ error: 'restaurantId and pin required' }, { status: 400 })
    await dbConnect()
    const emp = await Employee.findOne({ restaurantId, pinHash: hashPin(String(pin)), active: true }).lean()
    if (!emp) return NextResponse.json({ ok: false }, { status: 200 })
    const { pinHash, ...safe } = emp as any
    return NextResponse.json({ ok: true, employee: safe })
  } catch (e) {
    console.error('POST /api/employees/auth error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

