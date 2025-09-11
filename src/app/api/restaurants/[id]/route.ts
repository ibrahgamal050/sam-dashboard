import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';

// GET request to fetch a restaurant by ID
// GET request to fetch a restaurant by subdomain
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const restaurant = await Restaurant.findOne({ subdomain: params.id }); // Query by subdomain
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error); // Log the error for debugging
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}


// PUT request to update a restaurant by subdomain
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await request.json(); // Get the data from the request body
    const restaurant = await Restaurant.findOneAndUpdate(
      { subdomain: params.id }, // Query by subdomain instead of _id
      body, 
      { new: true, runValidators: true }
    );
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error); // Log the error for debugging
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}


// DELETE request to delete a restaurant by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const restaurant = await Restaurant.findByIdAndDelete(params.id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
  }
}
