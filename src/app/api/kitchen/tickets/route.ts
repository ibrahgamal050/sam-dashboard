import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import KitchenTicket from '@/models/KitchenTicket'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const station = searchParams.get('station')
    const status = searchParams.get('status')
    if (!restaurantId || !station) {
      return NextResponse.json({ error: 'restaurantId and station are required' }, { status: 400 })
    }
    await dbConnect()
    const query: any = { restaurantId, station }
    if (status) query.status = status
    const tickets = await KitchenTicket.find(query)
      .sort({ createdAt: -1 })
      .lean()
    return NextResponse.json({ tickets })
  } catch (e) {
    console.error('GET /api/kitchen/tickets', e)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

