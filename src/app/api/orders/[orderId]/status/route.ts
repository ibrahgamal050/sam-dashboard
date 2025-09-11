import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import { emitOrderEvent } from '@/lib/orderEvents'

export async function PATCH(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { status } = await req.json()
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    await dbConnect()
    const updated = await Order.findByIdAndUpdate(
      params.orderId,
      { status },
      { new: true }
    ).lean()
    if (!updated) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    emitOrderEvent(String(updated.restaurantId), 'order.updated', { orderId: String(updated._id), status })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/orders/:orderId/status', e)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}

