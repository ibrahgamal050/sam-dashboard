import { NextResponse } from 'next/server'

import dbConnect from '@/lib/dbConnect'
import Restaurant from '@/models/Restaurant'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const restaurant = await Restaurant.findOne({ subdomain: params.id })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json(mapRestaurantToClient(restaurant.toObject()))
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const payload = await request.json()
    const restaurant = await Restaurant.findOne({ subdomain: params.id })

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

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const restaurant = await Restaurant.findByIdAndDelete(params.id)
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
  if (!restaurant) return null

  return {
    _id: restaurant._id,
    name: {
      en: restaurant.nameEn ?? '',
      ar: restaurant.nameAr ?? '',
    },
    subdomain: restaurant.subdomain ?? '',
    logo: restaurant.logo ?? '',
    coverImage: restaurant.coverImage ?? '',
    description: restaurant.description ?? '',
    cuisine: {
      en: restaurant.cuisineEn ?? '',
      ar: restaurant.cuisineAr ?? '',
    },
    location: {
      en: restaurant.locationEn ?? '',
      ar: restaurant.locationAr ?? '',
    },
    phones: buildPhonesFromRestaurant(restaurant),
    social: restaurant.social ?? {},
    branches: restaurant.branches ?? [],
    hours: restaurant.hours ?? [],
    isPublished: restaurant.active ?? false,
    createdAt: restaurant.createdAt ?? null,
    updatedAt: restaurant.updatedAt ?? null,
  }
}

function buildPhonesFromRestaurant(restaurant: any): string[] {
  if (Array.isArray(restaurant.phones) && restaurant.phones.length > 0) {
    return restaurant.phones
  }

  if (typeof restaurant.hotline === 'string' && restaurant.hotline.trim()) {
    return [restaurant.hotline.trim()]
  }

  return []
}

function applyRestaurantUpdates(restaurant: any, payload: any) {
  if (!payload || typeof payload !== 'object') return

  if (payload.name) {
    if (payload.name.en !== undefined) {
      const trimmed = String(payload.name.en ?? '').trim()
      restaurant.nameEn = trimmed || restaurant.nameEn || restaurant.nameAr || restaurant.subdomain || 'Restaurant'
    }
    if (payload.name.ar !== undefined) {
      const trimmed = String(payload.name.ar ?? '').trim()
      restaurant.nameAr = trimmed || restaurant.nameAr || restaurant.nameEn || restaurant.subdomain || 'مطعم'
    }
  }

  if (payload.cuisine) {
    if (payload.cuisine.en !== undefined) {
      const trimmed = String(payload.cuisine.en ?? '').trim()
      restaurant.cuisineEn = trimmed || restaurant.cuisineEn || 'Cuisine'
    }
    if (payload.cuisine.ar !== undefined) {
      const trimmed = String(payload.cuisine.ar ?? '').trim()
      restaurant.cuisineAr = trimmed || restaurant.cuisineAr || 'مطبخ'
    }
  }

  if (payload.location) {
    if (payload.location.en !== undefined) {
      const trimmed = String(payload.location.en ?? '').trim()
      restaurant.locationEn = trimmed || restaurant.locationEn || 'Location'
    }
    if (payload.location.ar !== undefined) {
      const trimmed = String(payload.location.ar ?? '').trim()
      restaurant.locationAr = trimmed || restaurant.locationAr || 'الموقع'
    }
  }

  if (payload.description !== undefined) {
    restaurant.description = payload.description === null ? '' : String(payload.description)
  }

  if (payload.logo !== undefined) {
    restaurant.logo = payload.logo === null ? '' : String(payload.logo)
  }

  if (payload.coverImage !== undefined) {
    restaurant.coverImage = payload.coverImage === null ? '' : String(payload.coverImage)
  }

  if (payload.subdomain !== undefined && typeof payload.subdomain === 'string') {
    restaurant.subdomain = payload.subdomain.toLowerCase()
  }

  if (payload.phones) {
    const cleanedPhones = Array.isArray(payload.phones)
      ? payload.phones.map((phone: any) => String(phone ?? '').trim()).filter(Boolean)
      : []
    if (cleanedPhones.length > 0) {
      restaurant.hotline = cleanedPhones[0]
    }
    if (Array.isArray(payload.phones)) {
      restaurant.phones = cleanedPhones
    }
  }

  if (payload.social && typeof payload.social === 'object') {
    restaurant.social = { ...payload.social }
  }

  if (payload.branches) {
    restaurant.branches = payload.branches
  }

  if (payload.hours) {
    restaurant.hours = payload.hours
  }

  if (payload.isPublished !== undefined) {
    restaurant.active = Boolean(payload.isPublished)
  }

  restaurant.updatedAt = new Date()
}
