import { NextResponse } from "next/server"
import Branch from "@/models/branch"
import connectDB from '@/lib/dbConnect';
import { updateBranchSchema } from "@/server/validation/branch-schemas"
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
  { params }: { params: Promise<{ subdomain: string; id: string }> }
) {
  const resolvedParams = await params
  await connectDB()
  const restaurant = await getRestaurantBySubdomain(resolvedParams.subdomain)
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })

  const branch = await Branch.findOne({ _id: resolvedParams.id, restaurantId: restaurant._id })
  return branch ? NextResponse.json(branch) : NextResponse.json({ error: "Not found" }, { status: 404 })
}

export const PATCH = requireServerAuth(async ({ req, auth, params }) => {
  await connectDB()
  const restaurant = await getRestaurantBySubdomain(params.subdomain)
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
  if (!isOwner(auth?.user, String(restaurant._id))) {
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
  if (!isOwner(auth?.user, String(restaurant._id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const removed = await Branch.findOneAndDelete({ _id: params.id, restaurantId: restaurant._id })
  return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
})
