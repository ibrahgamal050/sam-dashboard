import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import KitchenTicket from '@/models/KitchenTicket'
import { emitKitchenEvent } from '@/lib/kitchenEvents'

export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const { state } = await req.json()
    if (!state) return NextResponse.json({ error: 'Missing state' }, { status: 400 })
    await dbConnect()
    const ticket = await KitchenTicket.findOneAndUpdate(
      { 'items._id': params.itemId },
      { $set: { 'items.$.state': state } },
      { new: true }
    )
    if (!ticket) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    // Auto-bump to READY when all items ready
    if (ticket.items.every((i) => i.state === 'ready')) {
      ticket.status = 'READY'
      await ticket.save()
    }
    emitKitchenEvent(String(ticket.restaurantId), ticket.station, 'item.updated', { ticketId: ticket.ticketId, itemId: params.itemId, state })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/kitchen/items/:itemId', e)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

