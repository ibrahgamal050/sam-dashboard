import { NextResponse } from 'next/server'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'
import dbConnect from '@/lib/dbConnect'
import Employee from '@/models/Employee'
import Restaurant from '@/models/Restaurant'
import crypto from 'crypto'

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(`pospin:${pin}`).digest('hex')
}

export async function PATCH(req: Request, context: RouteHandlerContext) {
  try {
    const body = await req.json()
    await dbConnect()
    const { subdomain, id } = await getRouteParams<{ subdomain?: string; id?: string }>(context)
    if (!subdomain || !id) {
      return NextResponse.json({ error: 'Missing route parameters' }, { status: 400 })
    }

    const rest = await Restaurant.findOne({ subdomain }).lean<{ _id?: string }>()
    if (!rest?._id) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    const restaurantId = String(rest._id)
    const update: any = {}
    if (typeof body.name === 'string') update.name = body.name
    if (typeof body.role === 'string') update.role = body.role
    if (typeof body.active === 'boolean') update.active = body.active
    if (body.pin) update.pinHash = hashPin(String(body.pin))
    const updated = await Employee.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: update },
      { new: true },
    ) as unknown as { toObject?: () => Record<string, unknown> }
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { pinHash, ...safe } = (updated.toObject ? updated.toObject() : updated) as any
    return NextResponse.json(safe)
  } catch (e) {
    console.error('PATCH /api/[subdomain]/employees/:id error', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: RouteHandlerContext) {
  try {
    await dbConnect()
    const { subdomain, id } = await getRouteParams<{ subdomain?: string; id?: string }>(context)
    if (!subdomain || !id) {
      return NextResponse.json({ error: 'Missing route parameters' }, { status: 400 })
    }

    const rest = await Restaurant.findOne({ subdomain }).lean<{ _id?: string }>()
    if (!rest?._id) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    const restaurantId = String(rest._id)
    const res = await Employee.deleteOne({ _id: id, restaurantId })
    return NextResponse.json({ deletedCount: res.deletedCount })
  } catch (e) {
    console.error('DELETE /api/[subdomain]/employees/:id error', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
