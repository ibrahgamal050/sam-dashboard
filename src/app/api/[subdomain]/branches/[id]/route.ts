import { NextResponse } from "next/server"
import Branch from "@/models/branch"
import connectDB from '@/lib/dbConnect';
import { updateBranchSchema } from "@/server/validation/branch-schemas"
import { requireServerAuth } from "@/server/auth/require-session"
import { getRestaurantBySubdomain } from "@/server/tenant/resolv"

export async function GET(_: Request, { params }: { params: { subdomain: string; id: string } }) {
  await connectDB()
  const restaurant = await getRestaurantBySubdomain(params.subdomain)
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })

  const branch = await Branch.findOne({ _id: params.id, restaurantId: restaurant._id })
  return branch ? NextResponse.json(branch) : NextResponse.json({ error: "Not found" }, { status: 404 })
}

export const PATCH = requireServerAuth(async ({ req, auth, params }) => {
  await connectDB()
  const restaurant = await getRestaurantBySubdomain(params.subdomain)
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
  if (!auth?.user?.restaurants?.includes(String(restaurant._id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()
  const parsed = updateBranchSchema.parse(data)

  if (parsed.slug) {
    const exists = await Branch.findOne({
      restaurantId: restaurant._id,
      slug: parsed.slug,
      _id: { $ne: params.id },
    })
    if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
  }

  const updated = await Branch.findOneAndUpdate(
    { _id: params.id, restaurantId: restaurant._id },
    { $set: parsed },
    { new: true }
  )
  return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Not found" }, { status: 404 })
})

export const DELETE = requireServerAuth(async ({ auth, params }) => {
  await connectDB()
  const restaurant = await getRestaurantBySubdomain(params.subdomain)
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
  if (!auth?.user?.restaurants?.includes(String(restaurant._id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const removed = await Branch.findOneAndDelete({ _id: params.id, restaurantId: restaurant._id })
  return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
})
