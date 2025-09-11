import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'

export async function POST(req: NextRequest) {
  try {
    const { orderId, type, printer } = await req.json()
    if (!orderId || !type) return NextResponse.json({ error: 'orderId and type required' }, { status: 400 })
    await dbConnect()
    const order = await Order.findById(orderId).lean()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    // Stub: in a real impl, render template + send to network printer or local bridge
    console.log('PRINT', { orderId, type, printer })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/print/receipt error', e)
    return NextResponse.json({ error: 'Failed to print' }, { status: 500 })
  }
}

