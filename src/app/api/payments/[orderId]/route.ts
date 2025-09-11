import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { method, amount, split } = await req.json()
    const { orderId } = await params
    if (!method || typeof amount !== 'number') {
      return NextResponse.json({ error: 'method and amount are required' }, { status: 400 })
    }
    await dbConnect()
    const order = await Order.findById(orderId)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Normalize method to schema enum (cod|card)
    const normalizedMethod = ((): 'cod' | 'card' => {
      const m = String(method).toLowerCase()
      if (m === 'cash' || m === 'cod') return 'cod'
      return 'card'
    })()

    // naive paid check; a real implementation would sum prior payments
    order.payment = { method: normalizedMethod,paymentStatus : 'paid' } as any
    // Mirror onto new top-level fields
    order.paymentStatus = 'paid' as any
    order.paymentMethod = normalizedMethod === 'cod' ? 'cash' as any : 'card' as any
    // Align with existing status enum (uses legacy 'Paid')
    order.paymentStatus = 'Paid' as any
    await order.save()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/payments/:orderId error', e)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
