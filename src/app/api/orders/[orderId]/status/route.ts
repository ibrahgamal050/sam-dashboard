import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import { emitOrderEvent } from '@/lib/orderEvents'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'

export async function PATCH(req: NextRequest, context: RouteHandlerContext) {
  try {
    const { status } = await req.json()
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    const { orderId } = await getRouteParams<{ orderId?: string }>(context)
    if (!orderId) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    await dbConnect()
    const updated =
      (mongoose.Types.ObjectId.isValid(orderId)
        ? await Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean()
        : null) ||
      (await Order.findOneAndUpdate({ _id: orderId as any }, { status }, { new: true }).lean()) ||
      (await Order.findOneAndUpdate({ orderId }, { status }, { new: true }).lean())
    if (!updated) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    emitOrderEvent(String(updated.restaurantId), 'order.updated', { orderId: String(updated._id), status })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/orders/:orderId/status', e)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
