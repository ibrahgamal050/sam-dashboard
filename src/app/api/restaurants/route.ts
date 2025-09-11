import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Restaurant from '@/models/Restaurant' // Adjust the import path as needed


// Ensure database connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw new Error('Failed to connect to the database')
  }
}

export async function POST(request: NextRequest) {
  await connectDB()

  try {
    const body = await request.json()
    const { nameEn, nameAr,hotline, cuisineAr,cuisineEn, subdomain,locationEn, locationAr } = body

    if (!nameEn || !nameAr ||!hotline|| !cuisineEn ||!cuisineAr || !subdomain || !locationEn || !locationAr) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Create new restaurant
    const newRestaurant = new Restaurant({
      nameEn,
      nameAr,
      cuisineEn, // Assuming cuisine is in English
      cuisineAr, // You might want to add a separate field for Arabic cuisine
      subdomain,
      hotline,
      locationEn, // Assuming location is in English
      locationAr, // You might want to add a separate field for Arabic location
    })

    // Save the restaurant
    await newRestaurant.save()
    

    return NextResponse.json(
      { message: 'Restaurant created successfully', restaurant: newRestaurant },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json(
      { message: 'Error creating restaurant', error: (error as Error).message },
      { status: 500 }
    )
  }
}
export async function GET(request: NextRequest) {
  await connectDB()

  try {
    const restaurants = await Restaurant.find({}).lean()
    return NextResponse.json(restaurants, { status: 200 })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { message: 'Error fetching restaurants', error: (error as Error).message },
      { status: 500 }
    )
  }
}
export async function PUT(request: NextRequest) {
  await connectDB()

  try {
    const body = await request.json()
    const { subdomain, nameEn, nameAr, hotline, cuisineAr, cuisineEn, locationEn, locationAr } = body

    // التحقق من أن جميع الحقول المطلوبة موجودة
    if (!subdomain || !nameEn || !nameAr || !hotline || !cuisineEn || !cuisineAr || !locationEn || !locationAr) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    console.log('Searching for restaurant with subdomain:', subdomain)  // سجل الـ subdomain

    // العثور على المطعم باستخدام الـ subdomain
    const restaurant = await Restaurant.findOne({ subdomain })

    if (!restaurant) {
      console.log('Restaurant not found with subdomain:', subdomain)  // سجل الخطأ هنا
      return NextResponse.json(
        { message: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // تحديث بيانات المطعم
    restaurant.nameEn = nameEn || restaurant.nameEn
    restaurant.nameAr = nameAr || restaurant.nameAr
    restaurant.hotline = hotline || restaurant.hotline
    restaurant.cuisineEn = cuisineEn || restaurant.cuisineEn
    restaurant.cuisineAr = cuisineAr || restaurant.cuisineAr
    restaurant.locationEn = locationEn || restaurant.locationEn
    restaurant.locationAr = locationAr || restaurant.locationAr

    // حفظ التحديثات في قاعدة البيانات
    await restaurant.save()

    return NextResponse.json(
      { message: 'Restaurant updated successfully', restaurant },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { message: 'Error updating restaurant', error: (error as Error).message },
      { status: 500 }
    )
  }
}


export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  })
}