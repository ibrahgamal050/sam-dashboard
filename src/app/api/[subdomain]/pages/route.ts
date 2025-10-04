import { NextRequest, NextResponse } from 'next/server'
import mongoose, { Types } from 'mongoose'

import dbConnect from '@/lib/dbConnect'
import Pages from '@/models/page'
import Restaurant from '@/models/Restaurant'
import type { IPage } from '@/types/page'

type IncomingPage = Partial<IPage> & {
  _id?: string
}

function buildNewPage(pageData: IncomingPage): IPage {
  const now = new Date()

  if (!pageData.name || !pageData.slug || !pageData.language || !pageData.seo || !pageData.components) {
    throw new Error('Missing required page fields')
  }

  return {
    _id: new Types.ObjectId(),
    name: pageData.name,
    slug: pageData.slug.toLowerCase(),
    language: pageData.language,
    template: Boolean(pageData.template),
    isPublished: Boolean(pageData.isPublished),
    headerImage: pageData.headerImage || '/placeholder.svg?height=400&width=800',
    seo: pageData.seo,
    components: pageData.components,
    metadata: {
      created_at: pageData.metadata?.created_at ? new Date(pageData.metadata.created_at) : now,
      updated_at: now,
      published_at: pageData.isPublished ? (pageData.metadata?.published_at ? new Date(pageData.metadata.published_at) : now) : undefined,
    },
  }
}

function updateExistingPage(existingPage: IPage, pageData: IncomingPage) {
  const now = new Date()

  if (pageData.name) existingPage.name = pageData.name
  if (pageData.slug) existingPage.slug = pageData.slug.toLowerCase()
  if (pageData.language) existingPage.language = pageData.language
  if (typeof pageData.template === 'boolean') existingPage.template = pageData.template
  if (typeof pageData.isPublished === 'boolean') existingPage.isPublished = pageData.isPublished
  if (pageData.headerImage) existingPage.headerImage = pageData.headerImage
  if (pageData.seo) existingPage.seo = pageData.seo
  if (pageData.components) existingPage.components = pageData.components

  existingPage.metadata = existingPage.metadata || { created_at: now, updated_at: now }
  existingPage.metadata.updated_at = now

  if (existingPage.isPublished) {
    existingPage.metadata.published_at = existingPage.metadata.published_at || now
  } else {
    delete existingPage.metadata.published_at
  }
}

function serializePagesResponse(pages: IPage[]) {
  return pages.map((page) => ({
    ...page,
    _id: page._id?.toString(),
  }))
}

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    await dbConnect()
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
        subdomain,
        pages: [],
      });
    } else if (pagesDocument.subdomain !== subdomain) {
      pagesDocument.subdomain = subdomain;
    }

    for (const pageData of pages as IncomingPage[]) {
      const identifier = pageData._id?.toString();
      const existingPage = pagesDocument.pages.find((p) => {
        if (identifier && p._id) {
          return p._id.toString() === identifier;
        }
        return p.slug === pageData.slug && p.language === pageData.language;
      });

      if (existingPage) {
        updateExistingPage(existingPage, pageData);
      } else {
        const newPage = buildNewPage(pageData);
        pagesDocument.pages.push(newPage);
      }
    }

    pagesDocument.markModified('pages');
    await pagesDocument.save();

    return NextResponse.json({
      success: true,
      message: 'Pages created/updated successfully',
      data: {
        restaurantId: pagesDocument.restaurantId,
        subdomain: pagesDocument.subdomain,
        pages: serializePagesResponse(pagesDocument.pages),
      }
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
    await dbConnect()
    const { subdomain } = params;

    const restaurant = await Restaurant.findOne({ subdomain });
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    const pagesDocument = await Pages.findOne({ restaurantId: restaurant._id }).lean();
    if (!pagesDocument) {
      return NextResponse.json({
        success: true,
        data: {
          restaurantId: restaurant._id,
          subdomain,
          pages: [],
        }
      }, { status: 200 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const language = url.searchParams.get('language');
    const isPublished = url.searchParams.get('isPublished');

    let filteredPages = pagesDocument.pages || [];

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
        subdomain: pagesDocument.subdomain,
        pages: serializePagesResponse(filteredPages as unknown as IPage[]),
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
