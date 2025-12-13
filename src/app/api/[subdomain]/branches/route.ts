import { NextResponse } from "next/server"
import Branch from "@/models/branch"
import connectDB from '@/lib/dbConnect';
import { createBranchSchema } from "@/server/validation/branch-schemas"
import { requireServerAuth } from "@/server/auth/require-session"
import { getRestaurantBySubdomain } from "@/server/tenant/resolve"

export async function GET(_: Request, { params }: { params: { subdomain: string } }) {
  await connectDB()
  const restaurant = await getRestaurantBySubdomain(params.subdomain)
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })

  const { searchParams } = new URL(_.url)
  const q = searchParams.get("q") || ""
  const page = Number(searchParams.get("page") || 1)
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100)

  const filter: any = { restaurantId: restaurant._id }
  if (q) filter.$or = [
    { name: { $regex: q, $options: "i" } },
    { "address.line1": { $regex: q, $options: "i" } },
    { slug: { $regex: q, $options: "i" } },
  ]

  const [items, total] = await Promise.all([
    Branch.find(filter).sort({ isMain: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Branch.countDocuments(filter),
  ])

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) })
}

export const POST = requireServerAuth(async ({ req, auth, params }) => {
  await connectDB()
  const restaurant = await getRestaurantBySubdomain(params.subdomain)
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })

  // تأكد إن المستخدم ليه حق على المطعم
  if (!auth?.user?.restaurants?.includes(String(restaurant._id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()
  const parsed = createBranchSchema.parse(data)
  const exists = await Branch.findOne({ restaurantId: restaurant._id, slug: parsed.slug })
  if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 })

  const doc = await Branch.create({ ...parsed, restaurantId: restaurant._id })
  return NextResponse.json(doc, { status: 201 })
})
