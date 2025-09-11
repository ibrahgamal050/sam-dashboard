import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Employee from '@/models/Employee'
import Restaurant from '@/models/Restaurant'
import crypto from 'crypto'

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(`pospin:${pin}`).digest('hex')
}

export async function GET(_req: NextRequest, { params }: { params: { subdomain: string } }) {
  try {
    await dbConnect()
    const rest = await Restaurant.findOne({ subdomain: params.subdomain }).lean()
    if (!rest) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    const staff = await Employee.find({ restaurantId: rest._id }).select({ pinHash: 0 }).sort({ role: 1, name: 1 }).lean()
    return NextResponse.json({ staff })
  } catch (e) {
    console.error('GET /api/[subdomain]/employees error', e)
    return NextResponse.json({ error: 'Failed to list employees' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { subdomain: string } }) {
  try {
    const { name, role, pin, active = true } = await req.json()
    if (!name || !role || !pin) return NextResponse.json({ error: 'name, role, pin required' }, { status: 400 })
    await dbConnect()
    const rest = await Restaurant.findOne({ subdomain: params.subdomain }).lean()
    if (!rest) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    const doc = await Employee.create({ restaurantId: rest._id, name, role, pinHash: hashPin(String(pin)), active })
    const { pinHash, ...safe } = (doc.toObject ? doc.toObject() : doc) as any
    return NextResponse.json(safe)
  } catch (e) {
    console.error('POST /api/[subdomain]/employees error', e)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}

