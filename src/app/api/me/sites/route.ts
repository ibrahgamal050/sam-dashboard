import { NextResponse } from "next/server"
import mongoose from "mongoose"

import dbConnect from "@/lib/dbConnect"
import Restaurant from "@/models/Restaurant"
import SuperMarket from "@/models/SuperMarket"
import { getMeelzaUser } from "@/lib/auth/meelza-session"

type RoleAssignment = {
  restaurantId?: string | { $oid?: string } | null
  supermarketId?: string | { $oid?: string } | null
  role?: string
}

type SitePayload = {
  id: string
  type: "restaurant" | "supermarket"
  name: any
  slug: string
  subdomain?: string
  logoUrl?: string | null
  coverImage?: string | null
  description?: string | null
  isPublished?: boolean
  phones?: string[]
  updatedAt?: string | null
  role?: string | null
}

const normalizeId = (value: any): string | null => {
  if (!value) return null
  if (typeof value === "string") return value
  if (typeof value === "object" && "$oid" in value) return value.$oid || null
  if (typeof value?.toString === "function") return value.toString()
  return null
}

const extractAssignments = (user: any): RoleAssignment[] => {
  const raw = Array.isArray(user?.roles)
    ? user.roles
    : Array.isArray(user?.roleAssignments)
      ? user.roleAssignments
      : []
  return raw.filter((entry: any) => entry && entry.role)
}

export async function GET() {
  try {
    const user = await getMeelzaUser()
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    await dbConnect()

    const rawRoles = Array.isArray(user?.roles)
      ? user.roles
      : typeof (user as any)?.roles === "string"
        ? [(user as any).roles]
        : Array.isArray((user as any)?.roleAssignments)
          ? (user as any).roleAssignments
          : []
    const realmRoles = Array.isArray((user as any)?.realm_access?.roles)
      ? ((user as any).realm_access.roles as any[])
      : []
    const normalizeRole = (role: any) =>
      String(role ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    const isAdminRole = (value: any) => normalizeRole(value) === "meelza_admin"
    const isAdmin =
      isAdminRole(user.role) ||
      rawRoles.some((entry: any) => {
        if (!entry) return false
        if (typeof entry === "string") return isAdminRole(entry)
        return isAdminRole(entry.role) || isAdminRole(entry.name)
      }) ||
      realmRoles.some((entry) => isAdminRole(entry))
    const assignments = extractAssignments(user)
    const fallbackRole =
      typeof user.role === "string" && user.role.trim().length > 0 ? user.role : "owner"

    const roleMap = new Map<string, string>()
    const ids: string[] = []

    assignments.forEach((assignment) => {
      const id = normalizeId(assignment.restaurantId ?? assignment.supermarketId)
      if (!id) return
      roleMap.set(id, assignment.role || "")
      ids.push(id)
    })

    const fallbackRestaurantId = normalizeId(user.restaurantId)
    if (fallbackRestaurantId && !roleMap.has(fallbackRestaurantId)) {
      roleMap.set(fallbackRestaurantId, fallbackRole)
      ids.push(fallbackRestaurantId)
    }

    const fallbackSupermarketId = normalizeId((user as any).supermarketId)
    if (fallbackSupermarketId && !roleMap.has(fallbackSupermarketId)) {
      roleMap.set(fallbackSupermarketId, fallbackRole)
      ids.push(fallbackSupermarketId)
    }

    const uniqueIds = Array.from(new Set(ids))

    let restaurants: any[] = []
    let supermarkets: any[] = []

    if (isAdmin || uniqueIds.length === 0 && assignments.some((entry) => !entry.restaurantId && !entry.supermarketId)) {
      restaurants = await Restaurant.find({}).lean()
      supermarkets = await SuperMarket.find({}).lean()
    } else if (uniqueIds.length) {
      const objectIds = uniqueIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      if (objectIds.length) {
        restaurants = await Restaurant.find({ _id: { $in: objectIds } }).lean()
        supermarkets = await SuperMarket.find({ _id: { $in: objectIds } }).lean()
      }
    }

    const restaurantPayload: SitePayload[] = restaurants.map((restaurant: any) => {
      const id = String(restaurant._id)
      return {
        id,
        type: "restaurant",
        name: restaurant.name,
        slug: restaurant.subdomain,
        subdomain: restaurant.subdomain,
        logoUrl: restaurant.logo || null,
        coverImage: restaurant.coverImage || null,
        description: restaurant.description || null,
        isPublished: Boolean(restaurant.isPublished),
        phones: restaurant.phones ?? [],
        updatedAt: restaurant.updatedAt?.toISOString?.() || null,
        role: roleMap.get(id) || (isAdmin ? "meelza_admin" : null),
      }
    })

    const supermarketPayload: SitePayload[] = supermarkets.map((market: any) => {
      const id = String(market._id)
      return {
        id,
        type: "supermarket",
        name: market.name,
        slug: market.slug,
        logoUrl: market.logoUrl || null,
        isPublished: true,
        updatedAt: market.updatedAt?.toISOString?.() || null,
        role: roleMap.get(id) || (isAdmin ? "meelza_admin" : null),
      }
    })

    const sites = [...restaurantPayload, ...supermarketPayload]

    return NextResponse.json({ sites }, { status: 200 })
  } catch (error) {
    console.error("Failed to load user sites", error)
    return NextResponse.json({ error: "FAILED_TO_LOAD_SITES" }, { status: 500 })
  }
}
