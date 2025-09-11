import { NextRequest, NextResponse } from 'next/server';
import Branches from '@/models/branches';
import Restaurant from '@/models/Restaurant';
import connectDB from '@/lib/dbConnect';


export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    await connectDB();
    const { subdomain } = params;
    
    // Validate subdomain
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    const restaurant = await Restaurant.findOne({ subdomain });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const { restaurantName, branches } = await request.json();

    // Validate input
    if (!restaurantName || !Array.isArray(branches) || branches.length === 0) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    let branchesDoc = await Branches.findOne({ restaurantId: restaurant._id });
    
    if (!branchesDoc) {
      branchesDoc = new Branches({
        restaurantId: restaurant._id,
        name: restaurantName,
        branches: []
      });
    } else {
      // Update the name if it has changed
      branchesDoc.name = restaurantName;
    }
    
    // Validate and add new branches
    const validBranches = branches.filter(branch => 
      branch.nameEn && branch.nameAr && branch.address && branch.image && branch.mapurl && branch.slug
    );

    if (validBranches.length !== branches.length) {
      return NextResponse.json({ error: 'Some branches have invalid or missing data' }, { status: 400 });
    }

    branchesDoc.branches.push(...validBranches);
    await branchesDoc.save();

    return NextResponse.json({ 
      message: 'Branches added successfully', 
      branches: branchesDoc.branches 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding branches:', error);
    return NextResponse.json({ 
      error: 'Failed to add branches', 
      details: error instanceof Error ? error.message : 'Unknown error' 
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
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const branches = await Branches.findOne({ restaurantId: restaurant._id });

    if (!branches) {
      return NextResponse.json([]);
    }

    return NextResponse.json(branches.branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    await connectDB();
    const { subdomain } = params;
    const restaurant = await Restaurant.findOne({ subdomain });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const updatedBranches = await request.json();
    const branches = await Branches.findOneAndUpdate(
      { restaurantId: restaurant._id },
      { $set: { branches: updatedBranches } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: 'Branches updated successfully', branches: branches.branches });
  } catch (error) {
    console.error('Error updating branches:', error);
    return NextResponse.json({ error: 'Failed to update branches' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    await connectDB();
    const { subdomain } = params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Branch slug is required' }, { status: 400 });
    }

    const restaurant = await Restaurant.findOne({ subdomain });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const branches = await Branches.findOneAndUpdate(
      { restaurantId: restaurant._id },
      { $pull: { branches: { slug: slug } } },
      { new: true }
    );

    if (!branches) {
      return NextResponse.json({ error: 'Branches not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}