import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'

export async function POST(req: Request, context: RouteHandlerContext) {
  try {
    const { method, amount, split } = await req.json()
    const { orderId } = await getRouteParams<{ orderId?: string }>(context)
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }
    if (!method || typeof amount !== 'number') {
      return NextResponse.json({ error: 'method and amount are required' }, { status: 400 })
    }
    await dbConnect()
    const order = await Order.findById(orderId)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Normalize method to schema enum (cod|card)
    const normalizedMethod = ((): 'cash' | 'card' => {
      const m = String(method).toLowerCase()
      if (m === 'cash' || m === 'cod') return 'cash'
      return 'card'
    })()

    // naive paid check; a real implementation would sum prior payments
    order.set('payment.method', normalizedMethod)
    order.set('payment.status', 'paid')
    await order.save()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/payments/:orderId error', e)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
