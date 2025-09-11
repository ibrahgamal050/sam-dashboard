import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import { emitOrderEvent } from '@/lib/orderEvents'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing required query param: restaurantId' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { error: 'Invalid restaurantId' },
        { status: 400 }
      )
    }
    const restObjectId = new mongoose.Types.ObjectId(restaurantId)

    const query: any = { restaurantId: restObjectId }

    const status = searchParams.get('status')
    const forKitchen = searchParams.has('kitchen')
    const includeReady = searchParams.has('includeReady')
    const forExpo = searchParams.has('expo')
    const paymentStatus = searchParams.get('paymentStatus')
    const paymentMethod = searchParams.get('paymentMethod')
    const type = searchParams.get('type')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    if (forKitchen) {
      query.status = { $in: includeReady ? ['pending','queued','in_progress','ready'] : ['pending','queued','in_progress'] }
    } else if (forExpo) {
      query.status = 'ready'
    } else if (status) {
      query.status = status
    }
    if (paymentStatus) query.paymentStatus = paymentStatus
    if (paymentMethod) query.paymentMethod = paymentMethod
    if (type) query.type = type
    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = new Date(from)
      if (to) query.createdAt.$lte = new Date(to)
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const cursor = searchParams.get('cursor') // ISO date or ms
    const findQuery: any = { ...query }
    if (cursor) {
      const dt = new Date(cursor)
      if (!isNaN(dt.getTime())) findQuery.createdAt = { ...(findQuery.createdAt || {}), $lt: dt }
    }

    const sortDir = forKitchen ? 1 : -1
    const orders = await Order.find(findQuery)
      .sort({ createdAt: sortDir })
      .limit(limit)
      .select({
        _id: 1,
        restaurantId: 1,
        userId: 1,
        items: 1,
        totalPrice: 1,
        subtotal: 1,
        deliveryFee: 1,
        currency: 1,
        payment: 1,
        paymentStatus: 1,
        paymentMethod: 1,
        status: 1,
        type: 1,
        table: 1,
        eta: 1,
        notes: 1,
        createdAt: 1,
      })
      .lean()

    // Format response to required shape
    const data = orders.map((o) => ({
      orderId: o._id.toString(),
      restaurantId: o.restaurantId?.toString?.() ?? o.restaurantId,
      userId: o.userId ? o.userId.toString() : null,
      items: (o.items || []).map((it: any) => ({
        productId: it.productId?.toString?.() ?? it.productId,
        name: it.name,
        quantity: it.quantity,
        price: it.price,
      })),
      totalPrice: o.totalPrice,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      type: o.type,
      table: o.table,
      eta: o.eta,
      notes: o.notes,
      createdAt: o.createdAt,
    }))

    const nextCursor = data.length === limit ? data[data.length - 1].createdAt : null
    return NextResponse.json({ orders: data, nextCursor }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    console.error('GET /api/orders error', err)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { restaurantId, items, subtotal, deliveryFee = 0, total, currency = 'USD', payment, status = 'in_progress', type = 'delivery', table, eta, notes, userId, customer } = body
    if (!restaurantId || !Array.isArray(items) || typeof subtotal !== 'number' || typeof total !== 'number') {
      return NextResponse.json({ error: 'restaurantId and items are required' }, { status: 400 })
    }
    await dbConnect()
    const doc = await Order.create({
      restaurantId,
      userId,
      items,
      subtotal,
      deliveryFee,
      totalPrice: total,
      currency,
      payment,
      status,
      type,
      table,
      eta,
      notes,
      customer,
    })

    emitOrderEvent(String(restaurantId), 'order.created', { orderId: String(doc._id) })
    return NextResponse.json({ orderId: String(doc._id) })
  } catch (e) {
    console.error('POST /api/orders error', e)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
