// src/components/dashboard/orders-live/hooks/useLiveOrders.ts
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import type { Locale } from "@/lib/locale"
import { resolveLocale } from "@/lib/locale"

const ORDER_TYPE_SOUNDS: Record<string, number> = {
  delivery: 480,
  pickup: 560,
  dine_in: 620,
  default: 440,
}

const DONE_STATUSES = new Set(["ready", "served", "completed", "delivered", "canceled", "cancelled", "rejected"])

type ApiOrder = {
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

const safeJson = async (res: Response) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const normalizeStatus = (status?: string) => String(status ?? "").toLowerCase().replace(/[\s-]+/g, "_")

const mapOrder = (order: ApiOrder) => {
  const dbId = order._id ? String(order._id) : undefined
  const externalId = order.orderId ? String(order.orderId) : undefined
  const id = dbId ?? externalId ?? ""
  const orderNumber = order.orderNumber ?? order.meta?.orderNumber

  const items = Array.isArray(order.items)
    ? order.items.map((item) => {
        const qty = Number(item.quantity ?? 0)
        const price = Number(item.price ?? 0)
        const total = Number.isFinite(item.total as number) ? Number(item.total) : price * qty
        return { ...item, quantity: qty, price, total }
      })
    : []

  const subtotal = Number(order.subtotal ?? 0)
  const tax = Number(order.tax ?? 0)
  const serviceFee = Number(order.serviceFee ?? 0)
  const deliveryFee = Number(order.deliveryFee ?? 0)
  const discount = Number(order.discount ?? order.amounts?.discount ?? 0)
  const total =
    Number.isFinite(order.totalPrice as number) && order.totalPrice !== undefined
      ? Number(order.totalPrice)
      : subtotal + tax + serviceFee + deliveryFee - discount

  const paymentMethod =
    order.payment?.method ?? order.paymentMethod ?? (order.meta?.paymentMethod as string | undefined)

  return {
    id,
    orderId: externalId ?? dbId ?? id,
    orderNumber: orderNumber ?? externalId ?? dbId ?? id,
    _id: dbId,
    subtotal,
    tax,
    serviceFee,
    deliveryFee,
    discount,
    totalPrice: total,
    currency: order.currency ?? "USD",
    status: (order.status ?? "pending").toLowerCase(),
    type: (order.type ?? "delivery").toLowerCase(),
    createdAt: order.createdAt ?? new Date().toISOString(),
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
      currency: order.currency ?? "USD",
    },
  }
}

type NormalizedOrder = ReturnType<typeof mapOrder>

type OrdersPayload = {
  restaurant?: {
    _id?: string
    name?: { en?: string; ar?: string } | string
    subdomain?: string
  }
  orders: NormalizedOrder[]
  entityType?: "restaurant" | "supermarket"
}

const fetchOrdersForRestaurant = async (key: readonly [string, string]): Promise<OrdersPayload> => {
  const restaurantSlug = key?.[1]
  if (!restaurantSlug) throw new Error("Missing restaurant slug")

  const restaurantRes = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}`, { cache: "no-store" })
  if (restaurantRes.ok) {
    const restaurant = await restaurantRes.json()
    const restaurantId = restaurant?._id
    if (!restaurantId) throw new Error("Restaurant id missing")

    const search = new URLSearchParams({ restaurantId, limit: "50" })
    const ordersRes = await fetch(`/api/orders?${search.toString()}`, { cache: "no-store" })
    if (!ordersRes.ok) {
      const errorPayload = await safeJson(ordersRes)
      throw new Error(errorPayload?.error || "Failed to fetch orders")
    }

    const body = await ordersRes.json()
    const mapped = Array.isArray(body?.orders) ? body.orders.map(mapOrder).filter((o: any) => Boolean(o.id)) : []
    return { restaurant, orders: mapped, entityType: "restaurant" }
  }

  if (restaurantRes.status !== 404) {
    const e = await safeJson(restaurantRes)
    throw new Error(e?.error || "Failed to resolve restaurant")
  }

  const marketRes = await fetch(`/api/retail/supermarkets/slug/${encodeURIComponent(restaurantSlug)}`, {
    cache: "no-store",
  })
  if (!marketRes.ok) {
    const e = await safeJson(marketRes)
    throw new Error(e?.error || "Failed to resolve supermarket")
  }

  const market = await marketRes.json()
  const supermarketId = market?._id
  if (!supermarketId) throw new Error("Supermarket id missing")

  const search = new URLSearchParams({ supermarketId, limit: "50" })
  const ordersRes = await fetch(`/api/orders?${search.toString()}`, { cache: "no-store" })
  if (!ordersRes.ok) {
    const errorPayload = await safeJson(ordersRes)
    throw new Error(errorPayload?.error || "Failed to fetch orders")
  }

  const body = await ordersRes.json()
  const mapped = Array.isArray(body?.orders) ? body.orders.map(mapOrder).filter((o: any) => Boolean(o.id)) : []
  return {
    restaurant: {
      _id: market._id,
      name: market.name ?? market.slug,
      subdomain: market.slug,
    },
    orders: mapped,
    entityType: "supermarket",
  }
}

type PendingActions = Record<string, { accept?: boolean; ready?: boolean; deliver?: boolean; cancel?: boolean }>

type UseLiveOrdersArgs = {
  restaurantSlug: string
  lang: Locale
}

export function useLiveOrders({ restaurantSlug, lang }: UseLiveOrdersArgs) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const [autoAccept, setAutoAccept] = useState(false)
  const [muteAutoAccepted, setMuteAutoAccepted] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const sortDirection: "newest" | "oldest" = "newest"

  const [pendingActions, setPendingActions] = useState<PendingActions>({})

  const autoAcceptedRef = useRef<Set<string>>(new Set())
  const prevOrderIdsRef = useRef<Set<string>>(new Set())
  const audioCtxRef = useRef<AudioContext | null>(null)

  // persist lang
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = resolveLocale(window.localStorage.getItem("mz.dashboard.lang"))
    // لا نعمل setLang هنا لأن الـ lang جاي من Layout
    // ده بس يضمن ان hook مايعتمدش على localStorage
  }, [])

  // persist autoAccept + mute
  useEffect(() => {
    if (typeof window === "undefined") return
    const storedAuto = window.localStorage.getItem("mz.autoAccept")
    if (storedAuto !== null) setAutoAccept(storedAuto === "true")
    const storedMute = window.localStorage.getItem("mz.autoAccept.mute")
    if (storedMute !== null) setMuteAutoAccepted(storedMute === "true")
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("mz.autoAccept", String(autoAccept))
  }, [autoAccept])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("mz.autoAccept.mute", String(muteAutoAccepted))
  }, [muteAutoAccepted])

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  const swrKey = restaurantSlug ? (["orders-by-restaurant", restaurantSlug] as const) : null

  const { data, error, isLoading, mutate, isValidating } = useSWR<OrdersPayload, any>(swrKey, fetchOrdersForRestaurant, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    keepPreviousData: true,
  })

  const restaurantId = useMemo(() => {
    const id = data?.restaurant?._id
    return id ? String(id) : undefined
  }, [data?.restaurant?._id])

  const restaurantName = useMemo(() => {
    const name = data?.restaurant?.name
    if (!name) return undefined
    if (typeof name === "string") return name
    if (lang === "ar" && name.ar) return name.ar
    if (lang === "en" && name.en) return name.en
    return name.en ?? name.ar ?? undefined
  }, [data?.restaurant?.name, lang])

  const isReadOnly = data?.entityType === "supermarket"

  const rawOrders = data?.orders ?? []

  const actionableOrders = useMemo(() => {
    return rawOrders.filter((order) => !DONE_STATUSES.has(String(order.status ?? "").toLowerCase()))
  }, [rawOrders])

  const searchValue = searchTerm.trim().toLowerCase()

  const filteredOrders = useMemo(() => {
    return rawOrders.filter((order) => {
      const status = String(order.status ?? "").toLowerCase()
      if (DONE_STATUSES.has(status)) return false

      if (!searchValue) return true

      return [order.id, order.orderId, order.customer?.name, order.customer?.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue))
    })
  }, [rawOrders, searchValue])

  const displayOrders = useMemo(() => {
    const sorted = [...filteredOrders]
    sorted.sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime()
      const bTime = new Date(b.createdAt ?? 0).getTime()
      return sortDirection === "newest" ? bTime - aTime : aTime - bTime
    })
    return sorted
  }, [filteredOrders])

  useEffect(() => {
    if (!displayOrders.length) {
      setSelectedOrderId(null)
      setIsDetailsOpen(false)
      return
    }
    if (!selectedOrderId || !displayOrders.some((o) => o.id === selectedOrderId)) {
      const nextId = displayOrders[0]?.id ?? null
      if (nextId && nextId !== selectedOrderId) setSelectedOrderId(nextId)
    }
  }, [displayOrders, selectedOrderId])

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return undefined
    return displayOrders.find((o) => o.id === selectedOrderId)
  }, [displayOrders, selectedOrderId])

  const selectedStatus = String(selectedOrder?.status ?? "").toLowerCase()

  const handleStatusChange = useCallback(
    async (orderId: string, status: string, kind: "accept" | "ready" | "deliver" | "cancel") => {
      if (!orderId) return
      if (isReadOnly) return
      if (!restaurantId) {
        console.warn("[orders:update] missing restaurant id; aborting")
        return
      }

      setPendingActions((prev) => {
        const next = { ...prev }
        next[orderId] = { ...(next[orderId] ?? {}), [kind]: true }
        return next
      })

      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            [data?.entityType === "supermarket" ? "x-supermarket-id" : "x-restaurant-id"]: restaurantId,
          },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) {
          const message = (await res.text()) || "Failed to update order status"
          throw new Error(message)
        }
        if (kind === "accept") autoAcceptedRef.current.add(orderId)
        await mutate()
      } catch (updateError) {
        console.error(`[orders:update:${kind}]`, updateError)
      } finally {
        setPendingActions((prev) => {
          const next = { ...prev }
          const entry = { ...(next[orderId] ?? {}), [kind]: false }
          const stillPending = Object.values(entry).some(Boolean)
          if (stillPending) next[orderId] = entry
          else delete next[orderId]
          return next
        })
      }
    },
    [mutate, restaurantId, isReadOnly, data?.entityType]
  )

  const ensureAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctor) return null
    if (!audioCtxRef.current) audioCtxRef.current = new Ctor()
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume().catch(() => {})
    return audioCtxRef.current
  }, [])

  const playNotification = useCallback(
    (orderType?: string) => {
      const ctx = ensureAudioContext()
      if (!ctx) return

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      const key = (orderType ?? "default").toLowerCase()
      const frequency = ORDER_TYPE_SOUNDS[key] ?? ORDER_TYPE_SOUNDS.default

      oscillator.type = "sine"
      oscillator.frequency.value = frequency
      gain.gain.value = 0.15

      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.35)
    },
    [ensureAudioContext]
  )

  // notification sound on new orders
  useEffect(() => {
    const currentIds = new Set<string>()
    rawOrders.forEach((order) => {
      if (order.id) currentIds.add(order.id)
    })

    rawOrders.forEach((order) => {
      const id = order.id
      if (!id || prevOrderIdsRef.current.has(id)) return
      const status = String(order.status ?? "").toLowerCase()
      if (status === "pending" && autoAccept && muteAutoAccepted) return
      playNotification(order.type)
    })

    prevOrderIdsRef.current = currentIds
  }, [rawOrders, autoAccept, muteAutoAccepted, playNotification])

  // cleanup autoAccepted set
  useEffect(() => {
    const actionableIds = new Set(actionableOrders.map((o) => o.id))
    autoAcceptedRef.current.forEach((id) => {
      if (!actionableIds.has(id)) autoAcceptedRef.current.delete(id)
    })
  }, [actionableOrders])

  // auto accept pending
  useEffect(() => {
    if (isReadOnly) return
    if (!autoAccept || !actionableOrders.length) return
    actionableOrders.forEach((order) => {
      const status = String(order.status ?? "").toLowerCase()
      if (status !== "pending") return
      if (pendingActions[order.id]?.accept) return
      if (autoAcceptedRef.current.has(order.id)) return
      autoAcceptedRef.current.add(order.id)
      handleStatusChange(order.id, "in_progress", "accept")
    })
  }, [autoAccept, actionableOrders, pendingActions, handleStatusChange, isReadOnly])

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,

    restaurantId,
    restaurantName,

    rawOrders,
    displayOrders,

    selectedOrder,
    selectedOrderId,
    setSelectedOrderId,

    isDetailsOpen,
    setIsDetailsOpen,

    autoAccept,
    setAutoAccept,

    muteAutoAccepted,
    setMuteAutoAccepted,

    searchTerm,
    setSearchTerm,

    pendingActions,
    handleStatusChange,

    selectedStatus,
    isReadOnly,
  }
}
