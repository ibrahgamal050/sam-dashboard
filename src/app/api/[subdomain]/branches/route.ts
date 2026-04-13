import { NextResponse } from "next/server"
import Branch from "@/models/branch"
import connectDB from '@/lib/dbConnect';
import { createBranchSchema } from "@/server/validation/branch-schemas"
import { requireServerAuth } from "@/server/auth/require-session"
import { getRestaurantBySubdomain } from "@/server/tenant/resolve"

const isOwner = (user: any, restaurantId: string) => {
  if (!user) return false
  const roles = Array.isArray(user.roles)
    ? user.roles
    : typeof (user as any).roles === "string"
      ? [(user as any).roles]
      : []
  const normalizeRole = (role: any) =>
    String(role ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  const isAdminRole = (value: any) => normalizeRole(value) === "meelza_admin"
  const hasAdminRole =
    isAdminRole(user.role) ||
    roles.some((entry: any) => {
      if (!entry) return false
      if (typeof entry === "string") return isAdminRole(entry)
      return isAdminRole(entry.role) || isAdminRole(entry.name)
    })
  if (hasAdminRole) return true
  const hasOwnerRole = roles.some((entry: any) => {
    if (!entry || entry.role !== "owner") return false
    if (!entry.restaurantId) return true
    return String(entry.restaurantId) === restaurantId
  })
  if (hasOwnerRole) return true
  if (user.role === "owner") {
    const primaryId = user.restaurantId ? String(user.restaurantId) : null
    return !primaryId || primaryId === restaurantId
  }
  return false
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const resolvedParams = await params
  await connectDB()
  const restaurant = await getRestaurantBySubdomain(resolvedParams.subdomain)
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
  if (!isOwner(auth?.user, String(restaurant._id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()
  const parsed = createBranchSchema.parse(data)
  const exists = await Branch.findOne({ restaurantId: restaurant._id, slug: parsed.slug })
  if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 })

  const doc = await Branch.create({ ...parsed, restaurantId: restaurant._id })
  return NextResponse.json(doc, { status: 201 })
})
