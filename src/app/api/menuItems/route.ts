import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RestaurantMenu from '@/models/RestaurantMenu';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { restaurantId, name, categories } = await req.json();

    if (!restaurantId || !name || !categories) {
      return NextResponse.json({ error: 'restaurantId, name, and categories are required' }, { status: 400 });
    }

    // تحقق إذا كانت القائمة موجودة بالفعل لهذا المطعم
    let restaurantMenu = await RestaurantMenu.findOne({ restaurantId });

    if (restaurantMenu) {
      // تحديث القائمة إذا كانت موجودة
      restaurantMenu.name = name;
      restaurantMenu.categories = categories;
      await restaurantMenu.save();
    } else {
      // إنشاء قائمة جديدة إذا لم تكن موجودة
      restaurantMenu = await RestaurantMenu.create({
        restaurantId,
        name,
        categories,
      });
    }

    return NextResponse.json(restaurantMenu, { status: 201 });
  } catch (error) {
    console.error('Failed to create/update restaurant menu:', error);
    return NextResponse.json({ error: 'Failed to create/update restaurant menu' }, { status: 500 });
  }
}
