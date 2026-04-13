// src/components/dashboard/orders-live/utils/orders-mappers.ts
"use client"

/**
 * كل اللي له علاقة بتحويل بيانات الـ API -> NormalizedOrder + fetcher
 * عشان صفحة الـ UI تبقى نظيفة.
 */

export type ApiOrder = {
  _id?: string
  orderId?: string
 orderNumber?: string
  total?: number
  totalPrice?: number
  subtotal?: number
  tax?: number
  serviceFee?: number
  deliveryFee?: number
  discount?: number

  status?: string
  type?: string
  currency?: string

  createdAt?: string
  updatedAt?: string
  notes?: string

  payment?: { method?: string; status?: string }
  paymentMethod?: string
  paymentStatus?: string

  customer?: {
    name?: string
    phone?: string
    email?: string
    address?: string
  }

  address?: any
  shippingAddress?: any
  deliveryAddress?: any

  items?: Array<{
    productId?: string
    name?: string
    quantity?: number
    price?: number
    total?: number
    image?: string
  }>

  meta?: Record<string, any>

  amounts?: {
    subtotal?: number
    tax?: number
    serviceFee?: number
    deliveryFee?: number
    discount?: number
    total?: number
    currency?: string
  }
}

export type NormalizedOrder = ReturnType<typeof mapOrder>

export type OrdersPayload = {
  restaurant?: {
    _id?: string
    name?: { en?: string; ar?: string }
    subdomain?: string
  }
  orders: NormalizedOrder[]
}

const safeJson = async (res: Response) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export const mapOrder = (order: ApiOrder) => {
  const dbId = order._id ? String(order._id) : undefined
  const externalId = order.orderId ? String(order.orderId) : undefined
  const id = dbId ?? externalId ?? ""

  const items = Array.isArray(order.items)
    ? order.items.map((item) => {
        const qty = Number(item.quantity ?? 0)
        const price = Number(item.price ?? 0)
        const total = Number.isFinite(item.total as number) ? Number(item.total) : price * qty
        return { ...item, quantity: qty, price, total }
      })
    : []

  const subtotal = Number(order.subtotal ?? order.amounts?.subtotal ?? 0)
  const tax = Number(order.tax ?? order.amounts?.tax ?? 0)
  const serviceFee = Number(order.serviceFee ?? order.amounts?.serviceFee ?? 0)
  const deliveryFee = Number(order.deliveryFee ?? order.amounts?.deliveryFee ?? 0)
  const discount = Number(order.discount ?? order.amounts?.discount ?? 0)

  const computedTotal = subtotal + tax + serviceFee + deliveryFee - discount
  const total =
    Number.isFinite(order.totalPrice as number) && order.totalPrice !== undefined
      ? Number(order.totalPrice)
      : Number.isFinite(order.total as number) && order.total !== undefined
        ? Number(order.total)
        : computedTotal

  const paymentMethod =
    order.payment?.method ?? order.paymentMethod ?? (order.meta?.paymentMethod as string | undefined)

  const status = String(order.status ?? "pending").toLowerCase()
  const type = String(order.type ?? "delivery").toLowerCase()

  return {
    id,
    orderId: externalId ?? dbId ?? id,
    _id: dbId,
    orderNumber: order.orderNumber ?? order.meta?.orderNumber ?? externalId ?? dbId ?? id,
    subtotal,
    tax,
    serviceFee,
    deliveryFee,
    discount,

    totalPrice: total,
    currency: order.currency ?? order.amounts?.currency ?? "USD",

    status,
    type,

    createdAt: order.createdAt ?? order.meta?.createdAt ?? new Date().toISOString(),
    updatedAt: order.updatedAt ?? order.meta?.updatedAt,
    notes: order.notes,

    items,
    count: items.reduce((sum, item) => sum + (Number.isFinite(item.quantity as number) ? Number(item.quantity) : 0), 0),

    payment: {
      method: paymentMethod ?? undefined,
      status: order.payment?.status ?? order.paymentStatus ?? undefined,
    },
    paymentMethod,
    paymentStatus: order.paymentStatus,

    customer: order.customer ?? {},
    address: order.address ?? order.shippingAddress ?? order.deliveryAddress ?? null,

    meta: order.meta ?? {},

    amounts: {
      subtotal,
      tax,
      serviceFee,
      deliveryFee,
      discount,
      total,
      currency: order.currency ?? order.amounts?.currency ?? "USD",
    },
  }
}

/**
 * SWR fetcher:
 * key = ["orders-by-restaurant", restaurantSlug]
 */
export const fetchOrdersForRestaurant = async (key: readonly [string, string]): Promise<OrdersPayload> => {
  const restaurantSlug = key?.[1]
  if (!restaurantSlug) throw new Error("Missing restaurant slug")

  // 1) resolve restaurant by slug
  const restaurantRes = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}`, { cache: "no-store" })
  if (!restaurantRes.ok) {
    const e = await safeJson(restaurantRes)
    throw new Error(e?.error || "Failed to resolve restaurant")
  }

  const restaurant = await restaurantRes.json()
  const restaurantId = restaurant?._id
  if (!restaurantId) throw new Error("Restaurant id missing")

  // 2) fetch orders list
  const search = new URLSearchParams({ restaurantId: String(restaurantId), limit: "50" })
  const ordersRes = await fetch(`/api/orders?${search.toString()}`, { cache: "no-store" })
  if (!ordersRes.ok) {
    const errorPayload = await safeJson(ordersRes)
    throw new Error(errorPayload?.error || "Failed to fetch orders")
  }

  const body = await ordersRes.json()
  const mapped = Array.isArray(body?.orders) ? body.orders.map(mapOrder).filter((o: any) => Boolean(o.id)) : []

  return { restaurant, orders: mapped }
}
