import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import RestaurantMenu from '@/models/RestaurantMenu'
import Restaurant from '@/models/Restaurant'
import { getRouteParams, type RouteHandlerContext } from '@/lib/route-params'

export async function POST(
  request: Request,
  context: RouteHandlerContext
) {
  try {
    await dbConnect()
    const { subdomain } = await getRouteParams<{ subdomain?: string }>(context)
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
    }

    const restaurant = await Restaurant.findOne({ subdomain })
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
    }

    const { categories, menuImages } = await request.json()

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: 'Categories are required and must be an array' }, { status: 400 })
    }

    let restaurantMenu = await RestaurantMenu.findOne({ restaurantId: restaurant._id })

    const restaurantName = restaurant.name?.ar || restaurant.name?.en || restaurant.subdomain

    if (restaurantMenu) {
      restaurantMenu.name = restaurantName
      restaurantMenu.categories = categories
      restaurantMenu.menuImages = menuImages
      await restaurantMenu.save()
    } else {
      restaurantMenu = await RestaurantMenu.create({
        restaurantId: restaurant._id,
        name: restaurantName,
        categories,
        menuImages,
      })
    }

    return NextResponse.json(restaurantMenu, { status: 201 })
  } catch (error) {
    console.error('Failed to create/update restaurant menu:', error)
    return NextResponse.json({ error: 'Failed to create/update restaurant menu' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: RouteHandlerContext
) {
  try {
    await dbConnect()
    const { subdomain } = await getRouteParams<{ subdomain?: string }>(context)
    if (!subdomain) {
      return NextResponse.json({ message: 'Subdomain is required' }, { status: 400 })
    }

    const restaurant = await Restaurant.findOne({ subdomain: { $regex: new RegExp(`^${subdomain}$`, 'i') } })

    if (!restaurant) {
      return NextResponse.json({ message: 'Restaurant not found' }, { status: 404 })
    }

    const body = await request.json()

    if (!body.categories || !Array.isArray(body.categories)) {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
    }

    const updatedMenu = await RestaurantMenu.findOneAndUpdate(
      { restaurantId: restaurant._id },
      { 
        categories: body.categories,
        menuImages: body.menuImages || []
      },
      { new: true, runValidators: true }
    )

    if (!updatedMenu) {
      return NextResponse.json({ message: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json(updatedMenu)
  } catch (error) {
    console.error('Failed to update restaurant menu:', error)
    return NextResponse.json({ error: 'Failed to update restaurant menu' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: RouteHandlerContext
) {
  try {
    await dbConnect()
    const { subdomain } = await getRouteParams<{ subdomain?: string }>(context)
    if (!subdomain) {
      return NextResponse.json({ message: 'Subdomain is required' }, { status: 400 })
    }

    const restaurant = await Restaurant.findOne({ subdomain: { $regex: new RegExp(`^${subdomain}$`, 'i') } })

    if (!restaurant) {
      return NextResponse.json({ message: 'Restaurant not found' }, { status: 404 })
    }

    const body = await request.json()

    const existingMenu = await RestaurantMenu.findOne({ restaurantId: restaurant._id })

    if (!existingMenu) {
      return NextResponse.json({ message: 'Menu not found' }, { status: 404 })
    }

    if (body.categories) {
      existingMenu.categories = body.categories
    }
    if (body.menuImages) {
      existingMenu.menuImages = body.menuImages
    }

    const updatedMenu = await existingMenu.save()

    return NextResponse.json(updatedMenu)
  } catch (error) {
    console.error('Failed to update restaurant menu:', error)
    return NextResponse.json({ error: 'Failed to update restaurant menu' }, { status: 500 })
  }
}

export async function GET(
  _request: Request,
  context: RouteHandlerContext
) {
  try {
    await dbConnect()
    const { subdomain } = await getRouteParams<{ subdomain?: string }>(context)
    if (!subdomain) {
      return NextResponse.json({ success: false, error: 'Subdomain is required' }, { status: 400 })
    }

    const restaurant = await Restaurant.findOne({ subdomain })
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
    }

    const menu = await RestaurantMenu.findOne({ restaurantId: restaurant._id })
    if (!menu) {
      return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Failed to fetch restaurant menu:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurant menu' }, { status: 500 })
  }
}
