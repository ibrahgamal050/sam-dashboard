import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Pages, { IPage, IPages } from '@/models/Pagenew'
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

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    await connectDB();
    const { subdomain } = params;

    const restaurant = await Restaurant.findOne({ subdomain });
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { pages } = body;

    if (!Array.isArray(pages)) {
      return NextResponse.json({ success: false, error: 'Invalid pages data' }, { status: 400 });
    }

    let pagesDocument = await Pages.findOne({ restaurantId: restaurant._id });

    if (!pagesDocument) {
      pagesDocument = new Pages({
        restaurantId: restaurant._id,
        name: restaurant.nameAr,
        pages: []
      });
    }

    for (const pageData of pages) {
      const { name, slug, language, template, isPublished, seo, headerImage, components } = pageData;

      const existingPageIndex = pagesDocument.pages.findIndex(
        p => p.slug === slug && p.language === language
      );

      const newPage: IPage = {
        _id: new mongoose.Types.ObjectId(), // إضافة _id هنا
        name,
        slug,
        language,
        template: template || false,
        isPublished: isPublished || false,
        seo,
        headerImage: headerImage || '/placeholder.svg?height=400&width=800',
        components,
        metadata: {
          created_at: new Date(),
          updated_at: new Date(),
          published_at: isPublished ? new Date() : undefined
        }
      };

      if (existingPageIndex !== -1) {
        // Update existing page
        pagesDocument.pages[existingPageIndex] = {
          ...pagesDocument.pages[existingPageIndex],
          ...newPage,
          metadata: {
            ...pagesDocument.pages[existingPageIndex].metadata,
            updated_at: new Date()
          }
        };
      } else {
        // Add new page
        pagesDocument.pages.push(newPage);
      }
    }

    await pagesDocument.save();

    return NextResponse.json({
      success: true,
      message: 'Pages created/updated successfully',
      data: pagesDocument
    }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/[subdomain]/pages:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'An error occurred while processing your request'
    }, { status: 500 });
  }
}
export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    await connectDB();
    const { subdomain } = params;

    const restaurant = await Restaurant.findOne({ subdomain });
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    const pagesDocument = await Pages.findOne({ restaurantId: restaurant._id });
    if (!pagesDocument) {
      return NextResponse.json({ success: false, error: 'No pages found for this restaurant' }, { status: 404 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const language = url.searchParams.get('language');
    const isPublished = url.searchParams.get('isPublished');

    let filteredPages = pagesDocument.pages;

    // Apply filters if provided
    if (language) {
      filteredPages = filteredPages.filter(page => page.language === language);
    }
    if (isPublished !== null) {
      const publishedStatus = isPublished === 'true';
      filteredPages = filteredPages.filter(page => page.isPublished === publishedStatus);
    }

    return NextResponse.json({
      success: true,
      data: {
        restaurantId: pagesDocument.restaurantId,
        name: pagesDocument.name,
        pages: filteredPages,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/[subdomain]/pages:', error);
    return NextResponse.json({
      success: false,
      error: 'An error occurred while fetching pages'
    }, { status: 500 });
  }
}

