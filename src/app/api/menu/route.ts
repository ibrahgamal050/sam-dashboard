import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Menu from '@/models/RestaurantMenu'

type LangValue = string | { ar?: string; en?: string } | null | undefined

function toLangObject(v: LangValue): { ar?: string; en?: string } {
  if (!v) return {}
  if (typeof v === 'string') return { ar: v, en: v }
  return { ar: v.ar, en: v.en }
}

function pickFirstText(v: LangValue): string | undefined {
  if (!v) return undefined
  if (typeof v === 'string') return v
  // فضّل العربية لو موجودة، وإلا الإنجليزية، وإلا أول قيمة متاحة
  return v.ar || v.en || Object.values(v)[0]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    await dbConnect()

    // ممكن يبقى في أكتر من مستند منيو للمطعم نفسه
    const menus = await Menu.find({ restaurantId }).lean()

    const products: any[] = []

    for (const m of menus) {
      const currency = toLangObject((m as any).currency)
      const categories = Array.isArray((m as any).categories) ? (m as any).categories : []

      for (const cat of categories) {
        const catNameObj = toLangObject(cat?.name)
        const catName = {
          ar: catNameObj.ar,
          en: catNameObj.en,
          // نص بسيط سريع لو محتاجه بواجهة واحدة
          _text: pickFirstText(cat?.name),
        }

        const items = Array.isArray(cat?.menuItems) ? cat.menuItems : []

        for (const it of items) {
          const name = toLangObject(it?.name)
          const description = toLangObject(it?.description)

          // بعض العناصر عندها sizes = null أو []
          const sizes =
            Array.isArray(it?.sizes) && it.sizes.length > 0
              ? it.sizes.map((s: any) => ({
                  _id: s?._id?.toString?.(),
                  name: toLangObject(s?.name),
                  price: typeof s?.price === 'number' ? s.price : null,
                }))
              : null

          products.push({
            _id: it?._id?.toString?.() || new mongoose.Types.ObjectId().toString(),
            restaurantId,
            // إرجاع الاسم/الوصف ككائن لغوي + نص بسيط للمشاركة السريعة
            name,
            nameText: pickFirstText(it?.name) || undefined,
            description,
            descriptionText: pickFirstText(it?.description) || undefined,
            price: typeof it?.price === 'number' ? it.price : null,
            image: it?.image || '',
            category: catName, // كائن لغوي + _text داخله
            tags: Array.isArray(it?.tags) ? it.tags : [],
            sizes, // null أو مصفوفة
            currency, // { ar, en } لو محتاج بواجهة العميل
          })
        }
      }
    }

    return NextResponse.json({ products })
  } catch (e) {
    console.error('GET /api/menu error:', e)
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 })
  }
}
