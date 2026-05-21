import { NextResponse } from "next/server"

import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import SuperMarket from "@/models/SuperMarket"
import { getRouteParams, type RouteHandlerContext } from "@/lib/route-params"

export async function GET(_request: Request, context: RouteHandlerContext) {
  try {
    await dbConnect()

    const { slug } = await getRouteParams<{ slug?: string }>(context)
    const normalized = (slug || "").trim().toLowerCase()
    if (!normalized) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 404 })
    }

    const market = await SuperMarket.findOne({ slug: normalized, isActive: true }).lean()
    if (!market) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 404 })
    }

    const brand = market.brandId ? await Brand.findById(market.brandId).lean() : null

    return NextResponse.json(mapMarketToClient(market, brand))
  } catch (error) {
    console.error("Error fetching supermarket:", error)
    return NextResponse.json({ error: "Failed to fetch supermarket" }, { status: 500 })
  }
}

export async function PUT(request: Request, context: RouteHandlerContext) {
  try {
    await dbConnect()

    const payload = await request.json()
    const { slug } = await getRouteParams<{ slug?: string }>(context)
    const normalized = (slug || "").trim().toLowerCase()
    if (!normalized) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 404 })
    }

    const market = await SuperMarket.findOne({ slug: normalized })
    if (!market) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 404 })
    }

    const brand = market.brandId ? await Brand.findById(market.brandId) : null

    applyMarketUpdates(market, payload)
    applyBrandUpdates(brand, payload)

    await market.save()
    if (brand) {
      await brand.save()
    }

    return NextResponse.json(mapMarketToClient(market.toObject(), brand?.toObject?.() ?? brand ?? null))
  } catch (error) {
    console.error("Error updating supermarket:", error)
    return NextResponse.json({ error: "Failed to update supermarket" }, { status: 500 })
  }
}

function mapMarketToClient(market: any, brand?: any) {
  return {
    _id: market._id?.toString?.() ?? market._id,
    name: market.name ?? "",
    nameAr: market.nameAr ?? "",
    nameEn: market.nameEn ?? "",
    slug: market.slug ?? "",
    brandType: market.brandType ?? "supermarket",
    logoUrl: market.logoUrl ?? "",
    coverImage: market.coverImage ?? "",
    description: market.description ?? "",
    address: market.address ?? "",
    city: market.city ?? "",
    country: market.country ?? "",
    cuisines: Array.isArray(market.cuisines) ? market.cuisines : [],
    tags: Array.isArray(market.tags) ? market.tags : [],
    gallery: Array.isArray(market.gallery) ? market.gallery : [],
    brandColors: market.brandColors ?? {},
    delivery: market.delivery ?? {},
    orderSettings: market.orderSettings ?? {},
    openingHours: Array.isArray(market.openingHours) ? market.openingHours : [],
    contact: market.contact ?? {},
    social: market.social ?? {},
    menuSettings: market.menuSettings ?? {},
    status: market.status ?? "draft",
    featured: market.featured ?? false,
    isActive: market.isActive ?? true,
    brand: brand
      ? {
          _id: brand._id?.toString?.() ?? brand._id,
          nameAr: brand.name?.ar ?? "",
          nameEn: brand.name?.en ?? "",
          slug: brand.slug ?? "",
          descriptionAr: brand.description?.ar ?? "",
          descriptionEn: brand.description?.en ?? "",
          logoUrl: brand.logo?.url ?? "",
          coverImage: brand.cover?.url ?? "",
          phone: brand.contacts?.phone ?? "",
          whatsapp: brand.contacts?.whatsapp ?? "",
          email: brand.contacts?.email ?? "",
          website: brand.contacts?.website ?? "",
          facebook: brand.social?.facebook ?? "",
          instagram: brand.social?.instagram ?? "",
          tiktok: brand.social?.tiktok ?? "",
          googleMapsUrl: brand.social?.googleMapsUrl ?? "",
          active: brand.active ?? true,
          isFeatured: brand.isFeatured ?? false,
        }
      : null,
  }
}

function applyMarketUpdates(market: any, payload: any) {
  if (!payload || typeof payload !== "object") return

  if (payload.nameAr !== undefined) {
    market.nameAr = String(payload.nameAr ?? "").trim()
    if (market.nameAr) market.name = market.nameAr
  }

  if (payload.nameEn !== undefined) {
    market.nameEn = String(payload.nameEn ?? "").trim()
    if (!market.name && market.nameEn) market.name = market.nameEn
  }

  if (payload.description !== undefined) {
    market.description = String(payload.description ?? "").trim()
  }

  if (payload.logoUrl !== undefined) {
    market.logoUrl = String(payload.logoUrl ?? "").trim()
  }

  if (payload.coverImage !== undefined) {
    market.coverImage = String(payload.coverImage ?? "").trim()
  }

  if (payload.address !== undefined) {
    market.address = String(payload.address ?? "").trim()
  }

  if (payload.city !== undefined) {
    market.city = String(payload.city ?? "").trim()
  }

  if (payload.country !== undefined) {
    market.country = String(payload.country ?? "").trim()
  }

  if (Array.isArray(payload.cuisines)) {
    market.cuisines = payload.cuisines.map((item: any) => String(item ?? "").trim()).filter(Boolean)
  }

  if (Array.isArray(payload.tags)) {
    market.tags = payload.tags.map((item: any) => String(item ?? "").trim()).filter(Boolean)
  }

  if (Array.isArray(payload.gallery)) {
    market.gallery = payload.gallery.map((item: any) => String(item ?? "").trim()).filter(Boolean)
  }

  if (payload.brandColors && typeof payload.brandColors === "object") {
    market.brandColors = {
      ...(market.brandColors ?? {}),
      ...(payload.brandColors ?? {}),
    }
  }

  if (payload.delivery && typeof payload.delivery === "object") {
    market.delivery = {
      ...(market.delivery ?? {}),
      ...(payload.delivery ?? {}),
    }
  }

  if (payload.orderSettings && typeof payload.orderSettings === "object") {
    market.orderSettings = {
      ...(market.orderSettings ?? {}),
      ...(payload.orderSettings ?? {}),
    }
  }

  if (Array.isArray(payload.openingHours)) {
    market.openingHours = payload.openingHours
  }

  if (payload.contact && typeof payload.contact === "object") {
    market.contact = {
      ...(market.contact ?? {}),
      ...(payload.contact ?? {}),
    }
  }

  if (payload.social && typeof payload.social === "object") {
    market.social = {
      ...(market.social ?? {}),
      ...(payload.social ?? {}),
    }
  }

  if (payload.menuSettings && typeof payload.menuSettings === "object") {
    market.menuSettings = {
      ...(market.menuSettings ?? {}),
      ...(payload.menuSettings ?? {}),
    }
  }

  if (payload.status !== undefined && typeof payload.status === "string") {
    market.status = payload.status
  }

  if (payload.featured !== undefined) {
    market.featured = Boolean(payload.featured)
  }

  if (payload.isActive !== undefined) {
    market.isActive = Boolean(payload.isActive)
  }

  market.updatedAt = new Date()
}

function applyBrandUpdates(brand: any, payload: any) {
  if (!brand || !payload || typeof payload !== "object") return

  if (payload.brandNameAr !== undefined || payload.brandNameEn !== undefined) {
    brand.name = {
      ...(brand.name ?? {}),
      ...(payload.brandNameAr !== undefined ? { ar: String(payload.brandNameAr ?? "").trim() } : {}),
      ...(payload.brandNameEn !== undefined ? { en: String(payload.brandNameEn ?? "").trim() } : {}),
    }
  }

  if (payload.brandDescriptionAr !== undefined || payload.brandDescriptionEn !== undefined) {
    brand.description = {
      ...(brand.description ?? {}),
      ...(payload.brandDescriptionAr !== undefined
        ? { ar: String(payload.brandDescriptionAr ?? "").trim() }
        : {}),
      ...(payload.brandDescriptionEn !== undefined
        ? { en: String(payload.brandDescriptionEn ?? "").trim() }
        : {}),
    }
  }

  if (payload.brandLogoUrl !== undefined) {
    const value = String(payload.brandLogoUrl ?? "").trim()
    brand.logo = value ? { ...(brand.logo ?? {}), url: value } : undefined
  }

  if (payload.brandCoverImage !== undefined) {
    const value = String(payload.brandCoverImage ?? "").trim()
    brand.cover = value ? { ...(brand.cover ?? {}), url: value } : undefined
  }

  if (
    payload.brandPhone !== undefined ||
    payload.brandWhatsapp !== undefined ||
    payload.brandEmail !== undefined ||
    payload.brandWebsite !== undefined
  ) {
    brand.contacts = {
      ...(brand.contacts ?? {}),
      ...(payload.brandPhone !== undefined ? { phone: String(payload.brandPhone ?? "").trim() } : {}),
      ...(payload.brandWhatsapp !== undefined ? { whatsapp: String(payload.brandWhatsapp ?? "").trim() } : {}),
      ...(payload.brandEmail !== undefined ? { email: String(payload.brandEmail ?? "").trim() } : {}),
      ...(payload.brandWebsite !== undefined ? { website: String(payload.brandWebsite ?? "").trim() } : {}),
    }
  }

  if (
    payload.brandFacebook !== undefined ||
    payload.brandInstagram !== undefined ||
    payload.brandTiktok !== undefined ||
    payload.brandGoogleMapsUrl !== undefined
  ) {
    brand.social = {
      ...(brand.social ?? {}),
      ...(payload.brandFacebook !== undefined ? { facebook: String(payload.brandFacebook ?? "").trim() } : {}),
      ...(payload.brandInstagram !== undefined ? { instagram: String(payload.brandInstagram ?? "").trim() } : {}),
      ...(payload.brandTiktok !== undefined ? { tiktok: String(payload.brandTiktok ?? "").trim() } : {}),
      ...(payload.brandGoogleMapsUrl !== undefined
        ? { googleMapsUrl: String(payload.brandGoogleMapsUrl ?? "").trim() }
        : {}),
    }
  }

  brand.updatedAt = new Date()
}
