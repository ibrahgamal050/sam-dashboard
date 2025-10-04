import { NextResponse } from 'next/server'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'
import dbConnect from '@/lib/dbConnect'
import Employee from '@/models/Employee'
import Restaurant from '@/models/Restaurant'
import crypto from 'crypto'

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(`pospin:${pin}`).digest('hex')
}

export async function GET(_req: Request, context: RouteHandlerContext) {
  try {
    await dbConnect()
    const { subdomain } = await getRouteParams<{ subdomain?: string }>(context)
    if (!subdomain) {
      return NextResponse.json({ error: 'Missing route parameters' }, { status: 400 })
    }

    const rest = await Restaurant.findOne({ subdomain }).lean<{ _id?: string }>()
    if (!rest?._id) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    const restaurantId = String(rest._id)
    const staff = await Employee.find({ restaurantId }).select({ pinHash: 0 }).sort({ role: 1, name: 1 }).lean()
    return NextResponse.json({ staff })
  } catch (e) {
    console.error('GET /api/[subdomain]/employees error', e)
    return NextResponse.json({ error: 'Failed to list employees' }, { status: 500 })
  }
}

export async function POST(req: Request, context: RouteHandlerContext) {
  try {
    const { name, role, pin, active = true } = await req.json()
    if (!name || !role || !pin) return NextResponse.json({ error: 'name, role, pin required' }, { status: 400 })
    await dbConnect()
    const { subdomain } = await getRouteParams<{ subdomain?: string }>(context)
    if (!subdomain) {
      return NextResponse.json({ error: 'Missing route parameters' }, { status: 400 })
    }

    const rest = await Restaurant.findOne({ subdomain }).lean<{ _id?: string }>()
    if (!rest?._id) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    const restaurantId = String(rest._id)
    const doc = await Employee.create({ restaurantId, name, role, pinHash: hashPin(String(pin)), active })
    const { pinHash, ...safe } = (doc.toObject ? doc.toObject() : doc) as any
    return NextResponse.json(safe)
  } catch (e) {
    console.error('POST /api/[subdomain]/employees error', e)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
