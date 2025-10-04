import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import mongoose from 'mongoose'
import { emitOrderEvent } from '@/lib/orderEvents'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'

export async function PATCH(req: Request, context: RouteHandlerContext) {
  try {
    const { orderId, index } = await getRouteParams<{ orderId?: string; index?: string }>(context)
    if (!orderId || index === undefined) {
      return NextResponse.json({ error: 'Missing route parameters' }, { status: 400 })
    }

    const idx = parseInt(index, 10)
    if (isNaN(idx)) return NextResponse.json({ error: 'Invalid item index' }, { status: 400 })
    const body = await req.json()
    const { state, qty, notes } = body as { state?: string; qty?: number; notes?: string }
    await dbConnect()
    const order = await Order.findById(orderId)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.items[idx]) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    if (state) (order.items[idx] as any).state = state
    if (typeof qty === 'number') (order.items[idx] as any).quantity = qty
    if (typeof notes === 'string') (order.items[idx] as any).notes = notes
    await order.save()
    emitOrderEvent(String(order.restaurantId), 'item.updated', { orderId: String(order._id), index: idx })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/orders/:orderId/items/:index', e)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}
