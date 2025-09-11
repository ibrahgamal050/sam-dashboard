import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Pages from '@/models/Pagenew'
import Restaurant from '@/models/Restaurant'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string; id: string } }
) {
  try {
    await connectDB();
    const { subdomain, id } = params;

    const restaurant = await Restaurant.findOne({ subdomain });
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    const pagesDocument = await Pages.findOne({ restaurantId: restaurant._id });
    if (!pagesDocument) {
      return NextResponse.json({ success: false, error: 'No pages found for this restaurant' }, { status: 404 });
    }

    const page = pagesDocument.pages.find(page => {
      if (!page._id) {
        console.warn('Page found without _id:', page);
        return false;
      }
      return page._id.toString() === id;
    });

    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: page
    }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/[subdomain]/pages/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'An error occurred while fetching the page'
    }, { status: 500 });
  }
}

