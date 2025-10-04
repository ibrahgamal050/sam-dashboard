import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import KitchenTicket from '@/models/KitchenTicket'
import { emitKitchenEvent } from '@/lib/kitchenEvents'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'

export async function PATCH(req: NextRequest, context: RouteHandlerContext) {
  try {
    const body = await req.json()
    const { action } = body as { action: 'bump' | 'recall' }
    if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    const { ticketId } = await getRouteParams<{ ticketId?: string }>(context)
    if (!ticketId) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    await dbConnect()
    const ticket = await KitchenTicket.findOne({ ticketId })
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    if (action === 'bump') {
      ticket.status = 'READY'
    } else if (action === 'recall') {
      // put back to COOKING (or QUEUED if desired); we'll use COOKING
      ticket.status = 'COOKING'
    }
    await ticket.save()
    emitKitchenEvent(String(ticket.restaurantId), ticket.station, 'ticket.bumped', { ticketId: ticket.ticketId, status: ticket.status })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/kitchen/tickets/:ticketId', e)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
