import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/lib/dbConnect'
import Pages from '@/models/page'
import Restaurant from '@/models/Restaurant'

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    await dbConnect()

    const { subdomain } = params
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No page ids provided' }, { status: 400 })
    }

    const restaurant = await Restaurant.findOne({ subdomain })
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
    }

    const pagesDocument = await Pages.findOne({ restaurantId: restaurant._id })
    if (!pagesDocument) {
      return NextResponse.json({ success: false, error: 'No pages found for this restaurant' }, { status: 404 })
    }

    const initialCount = pagesDocument.pages.length
    pagesDocument.pages = pagesDocument.pages.filter((page) => !ids.includes(page._id?.toString()))

    if (pagesDocument.pages.length === initialCount) {
      return NextResponse.json({ success: false, error: 'No matching pages found' }, { status: 404 })
    }

    pagesDocument.markModified('pages')
    await pagesDocument.save()

    return NextResponse.json({ success: true, message: 'Selected pages deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/[subdomain]/pages/delete-multiple:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred while deleting the selected pages'
    }, { status: 500 })
  }
}
