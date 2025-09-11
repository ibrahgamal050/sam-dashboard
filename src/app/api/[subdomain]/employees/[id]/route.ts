import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Employee from '@/models/Employee'
import Restaurant from '@/models/Restaurant'
import crypto from 'crypto'

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(`pospin:${pin}`).digest('hex')
}

export async function PATCH(req: NextRequest, { params }: { params: { subdomain: string; id: string } }) {
  try {
    const body = await req.json()
    await dbConnect()
    const rest = await Restaurant.findOne({ subdomain: params.subdomain }).lean()
    if (!rest) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    const update: any = {}
    if (typeof body.name === 'string') update.name = body.name
    if (typeof body.role === 'string') update.role = body.role
    if (typeof body.active === 'boolean') update.active = body.active
    if (body.pin) update.pinHash = hashPin(String(body.pin))
    const updated = await Employee.findOneAndUpdate({ _id: params.id, restaurantId: rest._id }, { $set: update }, { new: true })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { pinHash, ...safe } = (updated.toObject ? updated.toObject() : updated) as any
    return NextResponse.json(safe)
  } catch (e) {
    console.error('PATCH /api/[subdomain]/employees/:id error', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { subdomain: string; id: string } }) {
  try {
    await dbConnect()
    const rest = await Restaurant.findOne({ subdomain: params.subdomain }).lean()
    if (!rest) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    const res = await Employee.deleteOne({ _id: params.id, restaurantId: rest._id })
    return NextResponse.json({ deletedCount: res.deletedCount })
  } catch (e) {
    console.error('DELETE /api/[subdomain]/employees/:id error', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

