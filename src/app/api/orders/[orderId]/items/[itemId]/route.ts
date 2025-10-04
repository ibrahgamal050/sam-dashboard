import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import { emitOrderEvent } from '@/lib/orderEvents'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'

export async function PATCH(req: Request, context: RouteHandlerContext) {
  try {
    const { state, notes } = await req.json()
    if (!state && !notes) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    const { orderId, itemId } = await getRouteParams<{ orderId?: string; itemId?: string }>(context)
    if (!orderId || !itemId) {
      return NextResponse.json({ error: 'Missing route parameters' }, { status: 400 })
    }
    await dbConnect()
    const update: any = {}
    if (state) update['items.$.state'] = state
    if (typeof notes === 'string') update['items.$.notes'] = notes
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      { $set: update },
      { new: true }
    ).lean()
    if (!updated) return NextResponse.json({ error: 'Order or item not found' }, { status: 404 })
    emitOrderEvent(String(updated.restaurantId), 'item.updated', { orderId: String(updated._id), itemId, ...('state' in update ? { state } : {}) })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/orders/:orderId/items/:itemId', e)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}
