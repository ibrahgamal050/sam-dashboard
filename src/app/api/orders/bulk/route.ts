import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import { BulkPatchSchema } from '@/lib/orderEnums'
import { getTenantRestaurantId } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = BulkPatchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await dbConnect()
    const tenant = getTenantRestaurantId(req as any)
    if (!tenant || !mongoose.Types.ObjectId.isValid(tenant)) {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 403 })
    }
    const ids = parsed.data.ids.filter((id) => mongoose.Types.ObjectId.isValid(id))
    if (!ids.length) return NextResponse.json({ error: 'No valid ids' }, { status: 400 })
    const changes: any = {}
    if (parsed.data.changes.status) changes.status = parsed.data.changes.status
    const paymentStatusUpdate = parsed.data.changes.payment?.status ?? parsed.data.changes.paymentStatus
    const paymentMethodUpdate = parsed.data.changes.payment?.method ?? parsed.data.changes.paymentMethod
    if (paymentStatusUpdate) changes['payment.status'] = paymentStatusUpdate
    if (paymentMethodUpdate) changes['payment.method'] = paymentMethodUpdate

    const res = await Order.updateMany(
      { _id: { $in: ids }, restaurantId: new mongoose.Types.ObjectId(tenant) },
      { $set: changes }
    )
    const updated = await Order.find({ _id: { $in: ids } }).lean()
    return NextResponse.json({ matchedCount: res.matchedCount, modifiedCount: res.modifiedCount, orders: updated })
  } catch (e) {
    console.error('PATCH /api/orders/bulk error', e)
    return NextResponse.json({ error: 'Failed to bulk update' }, { status: 500 })
  }
}
