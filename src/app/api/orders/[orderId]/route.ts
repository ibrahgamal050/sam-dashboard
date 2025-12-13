import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Order from '@/models/Order'
import { PatchOneSchema } from '@/lib/orderEnums'
import { emitOrderEvent } from '@/lib/orderEvents'
import { assertTenantOrThrow } from '@/lib/auth'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'

export async function GET(req: NextRequest, context: RouteHandlerContext) {
  try {
    const { orderId: id } = await getRouteParams<{ orderId?: string }>(context)
    if (!id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await dbConnect()
    const byObjectId = mongoose.Types.ObjectId.isValid(id) ? await Order.findById(id).lean() : null
    const order = byObjectId || await Order.findOne({ orderId: id }).lean()
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const tenantCheck = assertTenantOrThrow(req as any, order.restaurantId as any)
    if (!tenantCheck.ok) return NextResponse.json({ error: tenantCheck.reason }, { status: 403 })
    return NextResponse.json(order)
  } catch (e) {
    console.error('GET /api/orders/:id error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: RouteHandlerContext) {
  try {
    const { orderId: id } = await getRouteParams<{ orderId?: string }>(context)
    if (!id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const body = await req.json()
    const parsed = PatchOneSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    await dbConnect()
    let existing = null as any
    if (mongoose.Types.ObjectId.isValid(id)) {
      existing = await Order.findById(id)
      if (!existing) existing = await Order.findOne({ _id: id as any })
    }
    if (!existing) existing = await Order.findOne({ orderId: id })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const tenantCheck = assertTenantOrThrow(req as any, existing.restaurantId as any)
    if (!tenantCheck.ok) return NextResponse.json({ error: tenantCheck.reason }, { status: 403 })
    const changes: any = {}
    const paymentStatusUpdate = parsed.data.payment?.status ?? parsed.data.paymentStatus
    const paymentMethodUpdate = parsed.data.payment?.method ?? parsed.data.paymentMethod
    if (parsed.data.status) changes.status = parsed.data.status
    if (paymentStatusUpdate) changes['payment.status'] = paymentStatusUpdate
    if (paymentMethodUpdate) changes['payment.method'] = paymentMethodUpdate
    const updated = await Order.findByIdAndUpdate(existing._id, { $set: changes }, { new: true })
    if (updated) {
      const payload: any = { orderId: String(updated._id) }
      if (parsed.data.status) payload.status = parsed.data.status
      if (paymentStatusUpdate) payload.paymentStatus = paymentStatusUpdate
      if (paymentMethodUpdate) payload.paymentMethod = paymentMethodUpdate
      emitOrderEvent(String(updated.restaurantId), 'order.updated', payload)
    }
    return NextResponse.json(updated?.toObject?.() || updated)
  } catch (e) {
    console.error('PATCH /api/orders/:id error', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
