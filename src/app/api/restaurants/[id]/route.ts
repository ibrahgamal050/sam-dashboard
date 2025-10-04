import { NextResponse } from 'next/server'

import dbConnect from '@/lib/dbConnect'
import Restaurant from '@/models/Restaurant'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'

const DEFAULT_FULFILLMENT_SETTINGS = {
  allowDelivery: true,
  allowPickup: true,
  allowDineIn: true,
  autoCompleteAfterMinutes: 0,
  sendReadyNotification: true,
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: Request, context: RouteHandlerContext) {
  try {
    await dbConnect()

    const { id } = await getRouteParams<{ id?: string }>(context)
    if (!id) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const restaurant = await Restaurant.findOne({ subdomain: id }).lean()
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json(mapRestaurantToClient(restaurant))
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: RouteHandlerContext) {
  try {
    await dbConnect()

    const payload = await request.json()

    const { id } = await getRouteParams<{ id?: string }>(context)
    if (!id) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const restaurant = await Restaurant.findOne({ subdomain: id })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    applyRestaurantUpdates(restaurant, payload)
    await restaurant.save()

    return NextResponse.json(mapRestaurantToClient(restaurant.toObject()))
  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteHandlerContext) {
  try {
    await dbConnect()
    const { id } = await getRouteParams<{ id?: string }>(context)
    if (!id) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    const restaurant = await Restaurant.findOneAndDelete({ subdomain: id })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Restaurant deleted successfully' })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 })
  }
}

function mapRestaurantToClient(restaurant: any) {
  return {
    _id: restaurant._id?.toString?.() ?? restaurant._id,
    name: {
      en: restaurant.name?.en ?? '',
      ar: restaurant.name?.ar ?? '',
    },
    subdomain: restaurant.subdomain ?? '',
    logo: restaurant.logo ?? '',
    coverImage: restaurant.coverImage ?? '',
    description: restaurant.description ?? '',
    social: restaurant.social ?? {},
    branches: Array.isArray(restaurant.branches) ? restaurant.branches : [],
    isPublished: restaurant.isPublished ?? false,
    phones: Array.isArray(restaurant.phones) ? restaurant.phones : [],
    fulfillmentSettings: {
      ...DEFAULT_FULFILLMENT_SETTINGS,
      ...(restaurant.fulfillmentSettings ?? {}),
    },
    createdAt: restaurant.createdAt ?? null,
    updatedAt: restaurant.updatedAt ?? null,
  }
}

function applyRestaurantUpdates(restaurant: any, payload: any) {
  if (!payload || typeof payload !== 'object') return

  if (!restaurant.name) {
    restaurant.name = { ar: '', en: '' }
  }

  if (payload.name) {
    if (payload.name.en !== undefined) {
      const trimmed = String(payload.name.en ?? '').trim()
      restaurant.name.en = trimmed || restaurant.name.en || 'Restaurant'
    }
    if (payload.name.ar !== undefined) {
      const trimmed = String(payload.name.ar ?? '').trim()
      restaurant.name.ar = trimmed || restaurant.name.ar || 'مطعم'
    }
    restaurant.markModified?.('name')
  }

  if (payload.description !== undefined) {
    restaurant.description = payload.description === null ? restaurant.description : String(payload.description)
  }

  if (payload.logo !== undefined) {
    const trimmed = String(payload.logo ?? '').trim()
    if (trimmed) {
      restaurant.logo = trimmed
    }
  }

  if (payload.coverImage !== undefined) {
    const trimmed = String(payload.coverImage ?? '').trim()
    if (trimmed) {
      restaurant.coverImage = trimmed
    }
  }

  if (payload.subdomain !== undefined && typeof payload.subdomain === 'string' && payload.subdomain.trim()) {
    restaurant.subdomain = payload.subdomain.trim().toLowerCase()
  }

  if (Array.isArray(payload.phones)) {
    const cleaned = payload.phones.map((phone: any) => String(phone ?? '').trim()).filter(Boolean)
    if (cleaned.length) {
      restaurant.phones = cleaned
    }
  }

  if (payload.social && typeof payload.social === 'object') {
    restaurant.social = {
      ...restaurant.social,
      ...(payload.social ?? {}),
    }
    restaurant.markModified?.('social')
  }

  if (payload.fulfillmentSettings && typeof payload.fulfillmentSettings === 'object') {
    const current = restaurant.fulfillmentSettings || {}
    restaurant.fulfillmentSettings = {
      ...DEFAULT_FULFILLMENT_SETTINGS,
      ...current,
      ...payload.fulfillmentSettings,
    }
    restaurant.markModified?.('fulfillmentSettings')
  }

  if (Array.isArray(payload.branches)) {
    restaurant.branches = payload.branches
    restaurant.markModified?.('branches')
  }

  if (payload.isPublished !== undefined) {
    restaurant.isPublished = Boolean(payload.isPublished)
  }

  restaurant.updatedAt = new Date()
}
