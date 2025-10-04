import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

import dbConnect from '@/lib/dbConnect'
import Pages from '@/models/page'
import Restaurant from '@/models/Restaurant'
import type { IPage } from '@/types/page'

const serializePage = (page: IPage) => ({
  ...page,
  _id: page._id?.toString(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string; id: string } }
) {
  try {
    await dbConnect()
    const { subdomain, id } = params;

    const restaurant = await Restaurant.findOne({ subdomain });
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 });
    }

    const pagesDocument = await Pages.findOne({ restaurantId: restaurant._id });
    if (!pagesDocument) {
      return NextResponse.json({ success: false, error: 'No pages found for this restaurant' }, { status: 404 });
    }

    const pageDocument = pagesDocument.pages.id(id);
    const page = pageDocument ? (pageDocument.toObject() as IPage) : null;

    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: serializePage(page)
    }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/[subdomain]/pages/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'An error occurred while fetching the page'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subdomain: string; id: string } }
) {
  try {
    await dbConnect()
    const { subdomain, id } = params

    const restaurant = await Restaurant.findOne({ subdomain })
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
    }

    const pagesDocument = await Pages.findOne({ restaurantId: restaurant._id })
    if (!pagesDocument) {
      return NextResponse.json({ success: false, error: 'No pages found for this restaurant' }, { status: 404 })
    }

    const pageToDelete = pagesDocument.pages.id(id)
    if (!pageToDelete) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }

    pageToDelete.deleteOne()
    pagesDocument.markModified('pages')
    await pagesDocument.save()

    return NextResponse.json({ success: true, message: 'Page deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/[subdomain]/pages/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred while deleting the page'
    }, { status: 500 })
  }
}
