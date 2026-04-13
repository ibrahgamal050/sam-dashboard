import { NextResponse } from "next/server"

import { getMeelzaUser } from "@/lib/auth/meelza-session"
import { isOwnerForTarget } from "@/lib/auth/ownership"
import { type MenuType, normalizeMenuType } from "@/lib/menu-types"
import { getRouteParams, type RouteHandlerContext } from "@/lib/route-params"
import {
  getDashboardMenu,
  importBrandMenuItems,
  resolveDashboardMenuContext,
  saveDashboardMenuOrder,
  updateDashboardMenuItemOverrides,
} from "@/server/menu/dashboardMenu.service"

type Params = { restaurantslug?: string }

const getRestaurantSlug = async (context: RouteHandlerContext) => {
  const { restaurantslug } = await getRouteParams<Params>(context)
  const decoded = restaurantslug ? decodeURIComponent(restaurantslug).trim() : ""
  return decoded || null
}

const getMenuType = (request: Request): MenuType | null => {
  const url = new URL(request.url)
  const raw = url.searchParams.get("menuType")
  const normalized = normalizeMenuType(raw)
  if (!normalized) return null
  return normalized
}

const getShowHidden = (request: Request) => {
  const url = new URL(request.url)
  const raw = url.searchParams.get("showHidden")
  return raw === "1" || raw === "true"
}

export async function GET(request: Request, context: RouteHandlerContext) {
  try {
    const restaurantslug = await getRestaurantSlug(context)
    if (!restaurantslug) {
      return NextResponse.json({ error: "restaurantslug is required" }, { status: 400 })
    }

    const menuType = getMenuType(request)
    if (!menuType) {
      return NextResponse.json({ error: "Invalid menuType" }, { status: 400 })
    }

    const resolved = await resolveDashboardMenuContext(restaurantslug)
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.message }, { status: resolved.status })
    }

    const user = await getMeelzaUser()
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    if (!isOwnerForTarget(user, { type: "restaurant", id: resolved.context.restaurantId })) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }

    const menu = await getDashboardMenu(resolved.context, menuType, {
      includeHidden: getShowHidden(request),
    })
    return NextResponse.json(menu)
  } catch (error) {
    console.error("GET /api/dashboard/restaurants/[restaurantslug]/menu error", error)
    return NextResponse.json({ error: "Failed to load menu" }, { status: 500 })
  }
}

export async function PUT(request: Request, context: RouteHandlerContext) {
  try {
    const restaurantslug = await getRestaurantSlug(context)
    if (!restaurantslug) {
      return NextResponse.json({ error: "restaurantslug is required" }, { status: 400 })
    }

    const menuType = getMenuType(request)
    if (!menuType) {
      return NextResponse.json({ error: "Invalid menuType" }, { status: 400 })
    }

    const resolved = await resolveDashboardMenuContext(restaurantslug)
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.message }, { status: resolved.status })
    }

    const user = await getMeelzaUser()
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    if (!isOwnerForTarget(user, { type: "restaurant", id: resolved.context.restaurantId })) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    if (body?.itemId) {
      const result = await updateDashboardMenuItemOverrides(resolved.context, body)
      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: result.status })
      }
      return NextResponse.json({ ok: true })
    }

    const categories = Array.isArray(body?.categories) ? body.categories : []
    await saveDashboardMenuOrder(resolved.context, categories, menuType)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("PUT /api/dashboard/restaurants/[restaurantslug]/menu error", error)
    return NextResponse.json({ error: "Failed to update menu order" }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteHandlerContext) {
  try {
    const restaurantslug = await getRestaurantSlug(context)
    if (!restaurantslug) {
      return NextResponse.json({ error: "restaurantslug is required" }, { status: 400 })
    }

    const menuType = getMenuType(request)
    if (!menuType) {
      return NextResponse.json({ error: "Invalid menuType" }, { status: 400 })
    }

    const resolved = await resolveDashboardMenuContext(restaurantslug)
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.message }, { status: resolved.status })
    }

    const user = await getMeelzaUser()
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    if (!isOwnerForTarget(user, { type: "restaurant", id: resolved.context.restaurantId })) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }

    const result = await importBrandMenuItems(resolved.context, menuType)
    return NextResponse.json(result)
  } catch (error) {
    console.error("POST /api/dashboard/restaurants/[restaurantslug]/menu error", error)
    return NextResponse.json({ error: "Failed to import menu items" }, { status: 500 })
  }
}
