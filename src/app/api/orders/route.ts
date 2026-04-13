import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import RetailOrder from '@/models/RetailOrder'
import DeliveryZone from '@/models/delivery-zone'
import { resolveDeliveryZone } from '@/lib/delivery/resolve-zone'
import type { IDeliveryZone } from '@/types/delivery-zone'
import { emitOrderEvent } from '@/lib/orderEvents'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const supermarketId = searchParams.get('supermarketId') || searchParams.get('branchId')

    if (!restaurantId && !supermarketId) {
      return NextResponse.json(
        { error: 'Missing required query param: restaurantId or supermarketId' },
        { status: 400 }
      )
    }
    if (restaurantId && supermarketId) {
      return NextResponse.json(
        { error: 'Use either restaurantId or supermarketId, not both' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Validate ObjectId
    const targetId = restaurantId || supermarketId || ""
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { error: restaurantId ? 'Invalid restaurantId' : 'Invalid supermarketId' },
        { status: 400 }
      )
    }
    const targetObjectId = new mongoose.Types.ObjectId(targetId)

    const normalizeQueryValue = (value: string) =>
      value.trim().toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_')

    const filters: any[] = restaurantId ? [{ restaurantId: targetObjectId }] : [{ branchId: targetObjectId }]

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
      filters.push({
        status: { $in: includeReady ? ['pending','queued','in_progress','ready'] : ['pending','queued','in_progress'] },
      })
    } else if (forExpo) {
      filters.push({ status: 'ready' })
    } else if (status) {
      filters.push({ status: normalizeQueryValue(status) })
    }
    if (paymentStatus) {
      const normalized = normalizeQueryValue(paymentStatus)
      filters.push({
        $or: [{ 'payment.status': normalized }, { paymentStatus: normalized }],
      })
    }
    if (paymentMethod) {
      const normalized = normalizeQueryValue(paymentMethod)
      filters.push({
        $or: [{ 'payment.method': normalized }, { paymentMethod: normalized }],
      })
    }
    if (type) filters.push({ type: normalizeQueryValue(type) })
    if (from || to) {
      const range: any = {}
      if (from) range.$gte = new Date(from)
      if (to) range.$lte = new Date(to)
      filters.push({ createdAt: range })
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const cursor = searchParams.get('cursor') // ISO date or ms
    const buildQuery = (parts: any[]) => {
      if (!parts.length) return {}
      if (parts.length === 1) return parts[0]
      return { $and: parts }
    }

    const baseFilters = [...filters]
    const findFilters = [...filters]

    if (cursor) {
      const dt = new Date(cursor)
      if (!isNaN(dt.getTime())) {
        findFilters.push({ createdAt: { $lt: dt } })
      }
    }

    const query = buildQuery(baseFilters)
    const findQuery = buildQuery(findFilters)

    const sortDir = forKitchen ? 1 : -1
    if (restaurantId) {
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
          deliveryZoneId: 1,
          deliveryLocation: 1,
          currency: 1,
          payment: 1,
          paymentStatus: 1,
          paymentMethod: 1,
          customer: 1,
          status: 1,
          type: 1,
          table: 1,
          eta: 1,
          notes: 1,
          createdAt: 1,
          updatedAt: 1,
          orderNumber: 1,
          meta: 1,
        })
        .lean()

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
        paymentStatus: o.payment?.status ?? (o as any).paymentStatus ?? null,
        paymentMethod: o.payment?.method ?? (o as any).paymentMethod ?? null,
        customer: (o as any).customer ?? null,
        type: o.type,
        table: o.table,
        eta: o.eta,
        notes: o.notes,
        deliveryFee: o.deliveryFee ?? 0,
        deliveryZoneId: o.deliveryZoneId ? o.deliveryZoneId.toString() : null,
        deliveryLocation: o.deliveryLocation ?? null,
        createdAt: o.createdAt,
        orderNumber: (o as any).orderNumber ?? (o as any)?.meta?.orderNumber ?? null,
        meta: (o as any).meta ?? null,
      }))

      const nextCursor = data.length === limit ? data[data.length - 1].createdAt : null
      return NextResponse.json({ orders: data, nextCursor }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const retailOrders = await RetailOrder.find(findQuery)
      .sort({ createdAt: sortDir })
      .limit(limit)
      .lean()

    const data = retailOrders.map((o: any) => {
      const items: Array<{
        productId: string | null
        name: string
        quantity: number
        price: number
      }> = Array.isArray(o.items)
        ? o.items.map((it: any) => {
            const qty = Number(it.quantity ?? 0)
            const unitPrice =
              Number.isFinite(it.unitPrice as number)
                ? Number(it.unitPrice)
                : qty
                  ? Number(it.subtotal ?? 0) / qty
                  : Number(it.price ?? 0)
            return {
              productId: it.productId?.toString?.() ?? it.productId,
              name: it.name,
              quantity: qty,
              price: Number(unitPrice ?? 0),
            }
          })
        : []
      const itemsTotal =
        Number.isFinite(o.itemsTotal as number) && o.itemsTotal !== undefined
          ? Number(o.itemsTotal)
          : items.reduce((sum: number, it) => sum + it.price * it.quantity, 0)
      const deliveryFee = Number(o.deliveryFee ?? 0)
      const totalPrice =
        Number.isFinite(o.payableTotal as number) && o.payableTotal !== undefined
          ? Number(o.payableTotal)
          : itemsTotal + deliveryFee

      return {
        orderId: String(o._id ?? o.orderId ?? ""),
        restaurantId: o.branchId?.toString?.() ?? o.branchId ?? null,
        userId: o.userId ? o.userId.toString?.() ?? o.userId : null,
        items,
        subtotal: itemsTotal,
        totalPrice,
        currency: o.currency ?? "EGP",
        status: o.status,
        paymentStatus: o.paymentStatus ?? null,
        paymentMethod: o.paymentMethod ?? null,
        type: "delivery",
        eta: o.eta ?? null,
        notes: o.notes ?? null,
        deliveryFee,
        deliveryZoneId: o.deliveryZoneId ? o.deliveryZoneId.toString?.() ?? o.deliveryZoneId : null,
        deliveryLocation: o.deliveryLocation ?? null,
        deliveryAddress: o.deliveryAddress ?? null,
        createdAt: o.createdAt,
        orderNumber: o.orderNumber ?? o.meta?.orderNumber ?? null,
        meta: { ...(o.meta ?? {}), branchId: o.branchId ?? null, source: "retail" },
      }
    })

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
    const {
      restaurantId,
      items,
      subtotal,
      deliveryFee = 0,
      total,
      currency = 'USD',
      payment,
      status = 'in_progress',
      type = 'delivery',
      table,
      eta,
      notes,
      userId,
      customer,
      deliveryZoneId,
      deliveryLocation,
    } = body

    if (!restaurantId || !Array.isArray(items) || typeof subtotal !== 'number' || typeof total !== 'number') {
      return NextResponse.json({ error: 'restaurantId and items are required' }, { status: 400 })
    }

    await dbConnect()

    let appliedDeliveryFee = Number(deliveryFee) || 0
    let appliedTotal = Number(total) || subtotal
    let appliedDeliveryZoneId: string | undefined = typeof deliveryZoneId === 'string' ? deliveryZoneId : undefined
    const normalizedType = typeof type === 'string' ? type.toLowerCase() : 'delivery'

    if (normalizedType === 'delivery') {
      let zoneInfo: { id: string; fee: number; minOrder: number } | null = null

      if (appliedDeliveryZoneId) {
        const zoneDoc = await DeliveryZone.findOne({ _id: appliedDeliveryZoneId, restaurantId }).lean<IDeliveryZone | null>()
        if (zoneDoc) {
          zoneInfo = {
            id: String(zoneDoc._id),
            fee: zoneDoc.fee,
            minOrder: zoneDoc.minOrder,
          }
        } else {
          appliedDeliveryZoneId = undefined
        }
      }

      const lat = deliveryLocation?.lat
      const lng = deliveryLocation?.lng

      if (!zoneInfo && typeof lat === 'number' && typeof lng === 'number') {
        const resolved = await resolveDeliveryZone(String(restaurantId), lat, lng)
        if (!resolved.inside || !resolved.zone) {
          return NextResponse.json({ error: 'Location outside delivery zones' }, { status: 400 })
        }
        zoneInfo = {
          id: resolved.zone.id,
          fee: resolved.zone.fee,
          minOrder: resolved.zone.minOrder,
        }
        appliedDeliveryZoneId = resolved.zone.id
      }

      if (!zoneInfo) {
        return NextResponse.json({ error: 'Delivery zone validation failed' }, { status: 400 })
      }

      if (subtotal < zoneInfo.minOrder) {
        return NextResponse.json({ error: 'Order does not meet delivery minimum' }, { status: 400 })
      }

      appliedDeliveryFee = zoneInfo.fee
      appliedTotal = (Number(total) || subtotal) - (Number(deliveryFee) || 0) + zoneInfo.fee
    }

    const orderPayload: any = {
      restaurantId,
      userId,
      items,
      subtotal,
      deliveryFee: appliedDeliveryFee,
      totalPrice: appliedTotal,
      currency,
      payment,
      status,
      type,
      table,
      eta,
      notes,
      customer,
    }

    if (normalizedType === 'delivery') {
      if (appliedDeliveryZoneId) {
        orderPayload.deliveryZoneId = appliedDeliveryZoneId
      }
      if (deliveryLocation && typeof deliveryLocation.lat === 'number' && typeof deliveryLocation.lng === 'number') {
        orderPayload.deliveryLocation = {
          lat: deliveryLocation.lat,
          lng: deliveryLocation.lng,
        }
      }
    }

    const doc = await Order.create(orderPayload)

    emitOrderEvent(String(restaurantId), 'order.created', { orderId: String(doc._id) })
    return NextResponse.json({ orderId: String(doc._id) })
  } catch (e) {
    console.error('POST /api/orders error', e)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
