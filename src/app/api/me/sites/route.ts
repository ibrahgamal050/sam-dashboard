import { NextResponse } from "next/server"
import mongoose, { type FilterQuery, type Types } from "mongoose"

import dbConnect from "@/lib/dbConnect"
import Restaurant from "@/models/Restaurant"
import SuperMarket from "@/models/SuperMarket"
import { getMeelzaUser } from "@/lib/auth/meelza-session"

type ObjectIdLike = string | { $oid?: string } | Types.ObjectId | null | undefined

type LocalizedText = {
  ar?: string
  en?: string
}

type RoleAssignment = {
  restaurantId?: ObjectIdLike
  supermarketId?: ObjectIdLike
  brandId?: ObjectIdLike
  role?: string
  name?: string
}

type SitePayload = {
  id: string
  type: "restaurant" | "supermarket"
  name: string | LocalizedText
  slug: string
  subdomain?: string
  logoUrl?: string | null
  coverImage?: string | null
  description?: string | LocalizedText | null
  isPublished?: boolean
  phones?: string[]
  updatedAt?: string | null
  role?: string | null
}

const normalizeId = (value: unknown): string | null => {
  if (!value) return null

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }

  if (typeof value === "object" && value !== null && "$oid" in value) {
    const oid = (value as { $oid?: string }).$oid
    return typeof oid === "string" && oid.trim().length ? oid.trim() : null
  }

  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toString?: () => string }).toString === "function"
  ) {
    const stringValue = (value as { toString: () => string }).toString()
    return stringValue && stringValue !== "[object Object]" ? stringValue : null
  }

  return null
}

const normalizeRole = (role: unknown): string =>
  String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

const extractAssignments = (user: any): RoleAssignment[] => {
  const raw = Array.isArray(user?.roles)
    ? user.roles
    : Array.isArray(user?.roleAssignments)
      ? user.roleAssignments
      : []

  return raw.filter((entry: any) => entry && typeof entry === "object")
}

const isAdminRole = (value: unknown) => ["meelza_admin", "admin", "superadmin"].includes(normalizeRole(value))

const toObjectIds = (ids: string[]): Types.ObjectId[] =>
  ids
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id))

const toIsoString = (value: unknown): string | null => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()

  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toISOString?: () => string }).toISOString === "function"
  ) {
    return (value as { toISOString: () => string }).toISOString()
  }

  return null
}

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((v) => String(v ?? "").trim()).filter(Boolean)))

export async function GET() {
  try {
    const user = await getMeelzaUser()

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    await dbConnect()

    const userRecord = user as Record<string, unknown>
    const rawRoles = Array.isArray(userRecord.roles)
      ? userRecord.roles
      : typeof userRecord.roles === "string"
        ? [userRecord.roles]
        : Array.isArray(userRecord.roleAssignments)
          ? userRecord.roleAssignments
          : []

    const realmRoles = Array.isArray((userRecord.realm_access as { roles?: unknown[] } | undefined)?.roles)
      ? ((userRecord.realm_access as { roles?: unknown[] }).roles ?? [])
      : []

    const isAdmin =
      isAdminRole(user?.role) ||
      rawRoles.some((entry: any) => {
        if (!entry) return false
        if (typeof entry === "string") return isAdminRole(entry)
        return isAdminRole(entry.role) || isAdminRole(entry.name)
      }) ||
      realmRoles.some((entry: unknown) => isAdminRole(entry))

    const assignments = extractAssignments(user)

    const fallbackRole =
      typeof user?.role === "string" && user.role.trim().length > 0
        ? user.role.trim()
        : "owner"

    const siteRoleMap = new Map<string, string>()
    const directIds = new Set<string>()
    const brandRoleMap = new Map<string, string>()

    for (const assignment of assignments) {
      const directRestaurantId = normalizeId(assignment.restaurantId)
      const directSupermarketId = normalizeId(assignment.supermarketId)
      const directId = directRestaurantId || directSupermarketId

      if (directId) {
        if (!siteRoleMap.has(directId)) {
          siteRoleMap.set(directId, assignment.role || "")
        } else {
          const currentRole = siteRoleMap.get(directId) || ""
          const nextRole = assignment.role || currentRole
          if (normalizeRole(nextRole) === "owner") {
            siteRoleMap.set(directId, nextRole)
          }
        }
        directIds.add(directId)
      }

      const brandId = normalizeId(assignment.brandId)
      if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
        const currentRole = brandRoleMap.get(brandId) || ""
        const nextRole = assignment.role || currentRole

        if (!brandRoleMap.has(brandId) || normalizeRole(nextRole) === "owner") {
          brandRoleMap.set(brandId, nextRole)
        }
      }
    }

    const fallbackRestaurantId = normalizeId(user?.restaurantId)
    if (fallbackRestaurantId && !siteRoleMap.has(fallbackRestaurantId)) {
      siteRoleMap.set(fallbackRestaurantId, fallbackRole)
      directIds.add(fallbackRestaurantId)
    }

    const fallbackSupermarketId = normalizeId(user?.supermarketId)
    if (fallbackSupermarketId && !siteRoleMap.has(fallbackSupermarketId)) {
      siteRoleMap.set(fallbackSupermarketId, fallbackRole)
      directIds.add(fallbackSupermarketId)
    }

    const fallbackBrandId = normalizeId(user?.brandId)
    if (
      fallbackBrandId &&
      mongoose.Types.ObjectId.isValid(fallbackBrandId) &&
      !brandRoleMap.has(fallbackBrandId)
    ) {
      brandRoleMap.set(fallbackBrandId, fallbackRole)
    }

    const uniqueIds = Array.from(directIds)

    const ownerBrandIds = Array.from(brandRoleMap.entries())
      .filter(([, role]) => normalizeRole(role) === "owner")
      .map(([brandId]) => brandId)

    const hasWildcardAssignment = assignments.some((entry) => {
      const restaurantId = normalizeId(entry.restaurantId)
      const supermarketId = normalizeId(entry.supermarketId)
      const brandId = normalizeId(entry.brandId)
      return !restaurantId && !supermarketId && !brandId
    })
    const hasAccessToSite = (site: {
      type: "restaurant" | "supermarket"
      id: string
      brandId?: unknown
    }) => {
      if (isAdmin) return true
      if (siteRoleMap.has(site.id)) return true

      const siteBrandId = normalizeId(site.brandId)
      if (siteBrandId) {
        const inheritedRole = brandRoleMap.get(siteBrandId)
        if (normalizeRole(inheritedRole) === "owner") return true
      }

      return false
    }

    let restaurants: any[] = []
    let supermarkets: any[] = []

    const shouldLoadAll =
      isAdmin || (uniqueIds.length === 0 && ownerBrandIds.length === 0 && hasWildcardAssignment)

    console.log("[/api/me/sites] auth context", {
      email: typeof user?.email === "string" ? user.email : null,
      sub: typeof user?.sub === "string" ? user.sub : null,
      role: typeof user?.role === "string" ? user.role : null,
      rawRoles: Array.isArray(user?.roles) ? user.roles : null,
      fallbackRestaurantId,
      fallbackSupermarketId,
      fallbackBrandId,
      normalizedAssignments: assignments.map((entry) => ({
        role: entry.role || null,
        restaurantId: normalizeId(entry.restaurantId),
        supermarketId: normalizeId(entry.supermarketId),
        brandId: normalizeId(entry.brandId),
      })),
      isAdmin,
      uniqueIds,
      ownerBrandIds,
      hasWildcardAssignment,
      shouldLoadAll,
    })

    if (shouldLoadAll) {
      restaurants = await Restaurant.find({}).lean()
      supermarkets = await SuperMarket.find({}).lean()
    } else {
      const objectIds = toObjectIds(uniqueIds)
      const ownerBrandObjectIds = toObjectIds(ownerBrandIds)

      const restaurantFilters: FilterQuery<any>[] = []
      const supermarketFilters: FilterQuery<any>[] = []

      if (objectIds.length > 0) {
        restaurantFilters.push({ _id: { $in: objectIds } })
        supermarketFilters.push({ _id: { $in: objectIds } })
      }

      if (ownerBrandObjectIds.length > 0) {
        restaurantFilters.push({ brandId: { $in: ownerBrandObjectIds } })
        supermarketFilters.push({ brandId: { $in: ownerBrandObjectIds } })
      }

      if (restaurantFilters.length > 0) {
        restaurants = await Restaurant.find(
          restaurantFilters.length === 1 ? restaurantFilters[0] : { $or: restaurantFilters }
        ).lean()
      }

      if (supermarketFilters.length > 0) {
        supermarkets = await SuperMarket.find(
          supermarketFilters.length === 1 ? supermarketFilters[0] : { $or: supermarketFilters }
        ).lean()
      }
    }

    console.log("[/api/me/sites] raw query results", {
      restaurantsCount: restaurants.length,
      supermarketsCount: supermarkets.length,
      restaurantIds: restaurants.map((restaurant: any) => String(restaurant._id)),
      supermarketIds: supermarkets.map((market: any) => String(market._id)),
    })

    const restaurantPayload: SitePayload[] = restaurants
      .filter((restaurant: any) =>
        hasAccessToSite({
          type: "restaurant",
          id: String(restaurant._id),
          brandId: restaurant.brandId,
        })
      )
      .map((restaurant: any) => {
      const id = String(restaurant._id)
      const brandId = normalizeId(restaurant.brandId)
      const inheritedRole = brandId ? brandRoleMap.get(brandId) : null

      return {
        id,
        type: "restaurant",
        name: restaurant.name,
        slug: restaurant.slug || restaurant.subdomain || id,
        subdomain: restaurant.subdomain || undefined,
        logoUrl: restaurant.logo || null,
        coverImage: restaurant.coverImage || null,
        description: restaurant.description || null,
        isPublished: Boolean(restaurant.isPublished),
        phones: Array.isArray(restaurant.phones) ? uniqueStrings(restaurant.phones) : [],
        updatedAt: toIsoString(restaurant.updatedAt),
        role: siteRoleMap.get(id) || inheritedRole || (isAdmin ? "meelza_admin" : null),
      }
      })

    const supermarketPayload: SitePayload[] = supermarkets
      .filter((market: any) =>
        hasAccessToSite({
          type: "supermarket",
          id: String(market._id),
          brandId: market.brandId,
        })
      )
      .map((market: any) => {
      const id = String(market._id)
      const brandId = normalizeId(market.brandId)
      const inheritedRole = brandId ? brandRoleMap.get(brandId) : null

      return {
        id,
        type: "supermarket",
        name: market.nameAr || market.nameEn || market.name,
        slug: market.slug || id,
        logoUrl: market.logoUrl || null,
        coverImage: market.coverImage || null,
        description: market.description || null,
        isPublished: market.status === "published",
        phones: uniqueStrings([market.contact?.phone, market.contact?.whatsapp]),
        updatedAt: toIsoString(market.updatedAt),
        role: siteRoleMap.get(id) || inheritedRole || (isAdmin ? "meelza_admin" : null),
      }
      })

    const dedupedSitesMap = new Map<string, SitePayload>()

    for (const site of [...restaurantPayload, ...supermarketPayload]) {
      dedupedSitesMap.set(`${site.type}:${site.id}`, site)
    }

    const sites = Array.from(dedupedSitesMap.values())

    console.log("[/api/me/sites] final sites", {
      total: sites.length,
      sites: sites.map((site) => ({
        id: site.id,
        type: site.type,
        slug: site.slug,
        role: site.role || null,
      })),
    })

    return NextResponse.json({ sites }, { status: 200 })
  } catch (error) {
    console.error("Failed to load user sites", error)
    return NextResponse.json({ error: "FAILED_TO_LOAD_SITES" }, { status: 500 })
  }
}
