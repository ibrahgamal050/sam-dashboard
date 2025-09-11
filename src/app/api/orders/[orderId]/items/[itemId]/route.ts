import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import { emitOrderEvent } from '@/lib/orderEvents'

export async function PATCH(req: NextRequest, { params }: { params: { orderId: string, itemId: string } }) {
  try {
    const { state, notes } = await req.json()
    if (!state && !notes) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    await dbConnect()
    const update: any = {}
    if (state) update['items.$.state'] = state
    if (typeof notes === 'string') update['items.$.notes'] = notes
    const updated = await Order.findOneAndUpdate(
      { _id: params.orderId, 'items._id': params.itemId },
      { $set: update },
      { new: true }
    ).lean()
    if (!updated) return NextResponse.json({ error: 'Order or item not found' }, { status: 404 })
    emitOrderEvent(String(updated.restaurantId), 'item.updated', { orderId: String(updated._id), itemId: params.itemId, ...('state' in update ? { state } : {}) })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/orders/:orderId/items/:itemId', e)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

