"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { useParams } from "next/navigation"
import { Bell, BellOff, ChevronLeft, RefreshCw, Search } from "lucide-react"

import { OrderDetails } from "@/components/orders-live/orders/order-details"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { getDirection, Locale, resolveLocale } from "@/lib/locale"

const ORDER_TYPE_SOUNDS: Record<string, number> = {
  delivery: 480,
  pickup: 560,
  dine_in: 620,
  default: 440,
}

const DONE_STATUSES = new Set(["ready", "served", "completed", "delivered", "canceled", "rejected"])

type ApiOrder = {
  _id?: string
  orderId?: string
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

type NormalizedOrder = ReturnType<typeof mapOrder>

type OrdersPayload = {
  restaurant?: {
    _id?: string
    name?: { en?: string; ar?: string }
    subdomain?: string
  }
  orders: NormalizedOrder[]
}

const STRINGS: Record<
  Locale,
  {
    fallbackTitle: string
    refresh: string
    autoAccept: string
    muteAutoAccepted: string
    searchPlaceholder: string
    statusPlaceholder: string
    typePlaceholder: string
    sortTooltip: { newest: string; oldest: string }
    liveRefresh: string
    failedBadge: string
    noRestaurantTitle: string
    noRestaurantSubtitle: string
    errorTitle: string
    tryAgain: string
    selectOrder: string
    noOrdersMatch: string
    mobileDetailsTitle: string
    language: string
  }
> = {
  en: {
    fallbackTitle: "Live Orders",
    refresh: "Refresh",
    autoAccept: "Auto-accept",
    muteAutoAccepted: "Mute auto-accepted",
    searchPlaceholder: "Search order #, customer, phone",
    statusPlaceholder: "Status",
    typePlaceholder: "Type",
    sortTooltip: {
      newest: "Sort by newest",
      oldest: "Sort by oldest",
    },
    liveRefresh: "Live refresh every 5s",
    failedBadge: "failed to load",
    noRestaurantTitle: "No restaurant selected",
    noRestaurantSubtitle: "Please choose a branch to view live orders.",
    errorTitle: "Failed to load orders",
    tryAgain: "Try again",
    selectOrder: "Select an order",
    noOrdersMatch: "No orders match your filters",
    mobileDetailsTitle: "Order Details",
    language: "Language",
  },
  ar: {
    fallbackTitle: "الطلبات الحية",
    refresh: "تحديث",
    autoAccept: "قبول تلقائي",
    muteAutoAccepted: "كتم الطلبات المقبولة تلقائيًا",
    searchPlaceholder: "ابحث برقم الطلب أو اسم العميل أو الهاتف",
    statusPlaceholder: "الحالة",
    typePlaceholder: "النوع",
    sortTooltip: {
      newest: "ترتيب من الأحدث",
      oldest: "ترتيب من الأقدم",
    },
    liveRefresh: "تحديث مباشر كل 5 ثوانٍ",
    failedBadge: "تعذر التحميل",
    noRestaurantTitle: "لم يتم اختيار مطعم",
    noRestaurantSubtitle: "يرجى اختيار فرع لعرض الطلبات اللحظية.",
    errorTitle: "تعذر تحميل الطلبات",
    tryAgain: "إعادة المحاولة",
    selectOrder: "اختر طلبًا",
    noOrdersMatch: "لا توجد طلبات مطابقة للمرشحات",
    mobileDetailsTitle: "تفاصيل الطلب",
    language: "اللغة",
  },
}

const safeJson = async (res: Response) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const normalizeStatus = (status?: string) => String(status ?? "").toLowerCase().replace(/[\s-]+/g, "_")

const formatCurrency = (amount: number, currency: string, locale: Locale) => {
  const localeTag = locale === "ar" ? "ar-EG" : "en-US"
  const safeCurrency = currency?.toUpperCase?.() || "USD"
  try {
    return new Intl.NumberFormat(localeTag, { style: "currency", currency: safeCurrency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${safeCurrency}`
  }
}

const formatTimeLabel = (value?: string, locale: Locale = "en") => {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)
}

const formatDuration = (value?: string) => {
  if (!value) return "00:30:00"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "00:30:00"
  const diff = Math.max(0, Date.now() - parsed.getTime())
  const totalSeconds = Math.floor(diff / 1000)
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
  const seconds = String(totalSeconds % 60).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

const toTitleCase = (value?: string) => {
  if (!value) return ""
  return value
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const mapOrder = (order: ApiOrder) => {
  const rawId = order.orderId ?? order._id ?? ""
  const id = rawId ? String(rawId) : ""

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
    orderId: id,
    _id: order._id,
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
    updatedAt: order.updatedAt,
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

const fetchOrdersForRestaurant = async (key: readonly [string, string]): Promise<OrdersPayload> => {
  const restaurantSlug = key?.[1]
  if (!restaurantSlug) throw new Error("Missing restaurant slug")

  const restaurantRes = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}`, {
    cache: "no-store",
  })
  if (!restaurantRes.ok) {
    const e = await safeJson(restaurantRes)
    throw new Error(e?.error || "Failed to resolve restaurant")
  }
  const restaurant = await restaurantRes.json()
  const restaurantId = restaurant?._id
  if (!restaurantId) {
    throw new Error("Restaurant id missing")
  }

  const search = new URLSearchParams({ restaurantId, limit: "50" })
  const ordersRes = await fetch(`/api/orders?${search.toString()}`, {
    cache: "no-store",
  })
  if (!ordersRes.ok) {
    const errorPayload = await safeJson(ordersRes)
    throw new Error(errorPayload?.error || "Failed to fetch orders")
  }
  const body = await ordersRes.json()
  const mapped = Array.isArray(body?.orders)
    ? body.orders.map(mapOrder).filter((o: any) => Boolean(o.id))
    : []

  return { restaurant, orders: mapped }
}

export default function OrdersPage() {
  const params = useParams<{ restaurant?: string | string[] }>()
  const rawSlug = Array.isArray(params?.restaurant) ? params.restaurant?.[0] : params?.restaurant
  const slug = (rawSlug ?? "").trim().toLowerCase()
  const invalidSlug = !slug || slug === "undefined" || slug === "null"
  const restaurantSlug = invalidSlug ? "pizzamaster" : slug

  const [lang, setLang] = useState<Locale>("en")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [autoAccept, setAutoAccept] = useState(false)
  const [muteAutoAccepted, setMuteAutoAccepted] = useState(true)
  const statusFilter = "active"
  const typeFilter = "all"
  const [searchTerm, setSearchTerm] = useState("")
  const sortDirection: "newest" | "oldest" = "newest"
  const [pendingActions, setPendingActions] = useState<
    Record<string, { accept?: boolean; ready?: boolean; deliver?: boolean; cancel?: boolean }>
  >({})

  const autoAcceptedRef = useRef<Set<string>>(new Set())
  const prevOrderIdsRef = useRef<Set<string>>(new Set())
  const audioCtxRef = useRef<AudioContext | null>(null)

  const swrKey = restaurantSlug ? (["orders-by-restaurant", restaurantSlug] as const) : null

  const { data, error, isLoading, mutate, isValidating } = useSWR<OrdersPayload, any>(
    swrKey,
    fetchOrdersForRestaurant,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  )

  const restaurantId = useMemo(() => {
    const id = data?.restaurant?._id
    return id ? String(id) : undefined
  }, [data?.restaurant?._id])

  const direction = getDirection(lang)
  const strings = STRINGS[lang] ?? STRINGS.en
  const restaurantName = useMemo(() => {
    const name = data?.restaurant?.name
    if (!name) return undefined
    if (lang === "ar" && name.ar) return name.ar
    if (lang === "en" && name.en) return name.en
    return name.en ?? name.ar ?? undefined
  }, [data?.restaurant?.name?.ar, data?.restaurant?.name?.en, lang])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = resolveLocale(window.localStorage.getItem("mz.dashboard.lang"))
    setLang(stored)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("mz.dashboard.lang", lang)
  }, [lang])

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

  const rawOrders = data?.orders ?? []
  const actionableOrders = useMemo(
    () =>
      rawOrders.filter((order) => {
        const status = String(order.status ?? "").toLowerCase()
        return !DONE_STATUSES.has(status)
      }),
    [rawOrders]
  )

  const searchValue = searchTerm.trim().toLowerCase()

  const filteredOrders = useMemo(() => {
    return rawOrders.filter((order) => {
      const status = String(order.status ?? "").toLowerCase()
      const type = String(order.type ?? "").toLowerCase()

      const matchesStatus = statusFilter === "active" ? !DONE_STATUSES.has(status) : status === statusFilter

      const matchesType = typeFilter === "all" ? true : type === typeFilter

      const matchesSearch =
        !searchValue ||
        [order.id, order.orderId, order.customer?.name, order.customer?.phone]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchValue))

      return matchesStatus && matchesType && matchesSearch
    })
  }, [rawOrders, statusFilter, typeFilter, searchValue])

  const displayOrders = useMemo(() => {
    const sorted = [...filteredOrders]
    sorted.sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime()
      const bTime = new Date(b.createdAt ?? 0).getTime()
      return sortDirection === "newest" ? bTime - aTime : aTime - bTime
    })
    return sorted
  }, [filteredOrders, sortDirection])

  useEffect(() => {
    if (!displayOrders.length) {
      setSelectedOrderId(null)
      setIsDetailsOpen(false)
      return
    }
    if (!selectedOrderId || !displayOrders.some((order) => order.id === selectedOrderId)) {
      const nextId = displayOrders[0]?.id ?? null
      if (nextId && nextId !== selectedOrderId) setSelectedOrderId(nextId)
    }
  }, [displayOrders, selectedOrderId])

  const handleStatusChange = useCallback(
    async (orderId: string, status: string, kind: "accept" | "ready" | "deliver" | "cancel") => {
      if (!orderId) return
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
            "x-restaurant-id": restaurantId,
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
    [mutate, restaurantId]
  )

  const ensureAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctor) return null
    if (!audioCtxRef.current) {
      audioCtxRef.current = new Ctor()
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {})
    }
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

  useEffect(() => {
    const currentIds = new Set<string>()
    rawOrders.forEach((order) => {
      if (order.id) currentIds.add(order.id)
    })

    rawOrders.forEach((order) => {
      const id = order.id
      if (!id || prevOrderIdsRef.current.has(id)) return
      const status = String(order.status ?? "").toLowerCase()
      if (status === "pending" && autoAccept && muteAutoAccepted) {
        return
      }
      playNotification(order.type)
    })

    prevOrderIdsRef.current = currentIds
  }, [rawOrders, autoAccept, muteAutoAccepted, playNotification])

  useEffect(() => {
    const actionableIds = new Set(actionableOrders.map((order) => order.id))
    autoAcceptedRef.current.forEach((id) => {
      if (!actionableIds.has(id)) autoAcceptedRef.current.delete(id)
    })
  }, [actionableOrders])

  useEffect(() => {
    if (!autoAccept || !actionableOrders.length) return
    actionableOrders.forEach((order) => {
      const status = String(order.status ?? "").toLowerCase()
      if (status === "pending") {
        if (pendingActions[order.id]?.accept) return
        if (autoAcceptedRef.current.has(order.id)) return
        autoAcceptedRef.current.add(order.id)
        handleStatusChange(order.id, "in_progress", "accept")
      }
    })
  }, [autoAccept, actionableOrders, pendingActions, handleStatusChange])

  const selectedOrder =
    selectedOrderId && displayOrders.length
      ? displayOrders.find((order) => order.id === selectedOrderId)
      : undefined

  const selectedStatus = String(selectedOrder?.status ?? "").toLowerCase()
  const accepting = selectedOrder ? Boolean(pendingActions[selectedOrder.id]?.accept) : false
  const readying = selectedOrder ? Boolean(pendingActions[selectedOrder.id]?.ready) : false
  const delivering = selectedOrder ? Boolean(pendingActions[selectedOrder.id]?.deliver) : false
  const canceling = selectedOrder ? Boolean(pendingActions[selectedOrder.id]?.cancel) : false
  const handleOpenDetails = (id?: string | null) => {
    if (!id) return
    setSelectedOrderId(id)
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsDetailsOpen(true)
    }
  }

  const actionForOrder = (order: NormalizedOrder) => {
    const status = normalizeStatus(order.status)
    const pending = pendingActions[order.id ?? ""] ?? {}
    const distance =
      typeof order.meta?.distance === "number"
        ? `${order.meta.distance.toFixed(1)}km away`
        : typeof order.meta?.distance === "string"
          ? `${order.meta.distance} away`
          : undefined

    if (status === "pending" || status === "queued") {
      return {
        label: "View",
        color: "bg-[#0EBE7F]",
        text: "text-white",
        onClick: () => handleOpenDetails(order.id),
      }
    }
    if (["in_progress", "processing", "accepted", "preparing"].includes(status)) {
      return {
        label: pending.ready ? "Updating..." : "Ready",
        color: "bg-[#FF6D2E]",
        text: "text-white",
        onClick: () => order.id && handleStatusChange(order.id, "ready", "ready"),
      }
    }
    if (status === "ready") {
      return {
        label: pending.deliver ? "Updating..." : distance ?? "Arrived",
        color: "bg-gradient-to-r from-[#7C8AFF] to-[#5BC8FB]",
        text: "text-white",
        onClick: () => order.id && handleStatusChange(order.id, "delivered", "deliver"),
      }
    }
    if (["delivered", "completed"].includes(status)) {
      return { label: "Completed", color: "bg-gray-200", text: "text-gray-600", disabled: true }
    }
    if (["canceled", "cancelled", "rejected"].includes(status)) {
      return { label: "Canceled", color: "bg-gray-200", text: "text-gray-600", disabled: true }
    }
    return {
      label: "View",
      color: "bg-gray-200",
      text: "text-gray-700",
      onClick: () => handleOpenDetails(order.id),
    }
  }

  const renderOrderRow = (order: NormalizedOrder) => {
    const id = order.orderId ?? order.id ?? order._id ?? "—"
    const token =
      (order.meta?.token as string) ??
      (order.meta?.table as string) ??
      (order.meta?.brand as string) ??
      order.type ??
      "—"
    const brandName = toTitleCase(order.meta?.brand as string) || "Brand"
    const brandId =
      (order.meta?.brandId as string) ??
      (order.meta?.brand as string) ??
      (order.meta?.table as string) ??
      "Brand 1"
    const providerName = toTitleCase(
      (order.meta?.provider as string) ??
        (order.meta?.channel as string) ??
        (order.meta?.source as string) ??
        "Zomato"
    )
    const providerKey = normalizeStatus(providerName)
    const providerPalette: Record<string, { bg: string; text: string }> = {
      zomato: { bg: "bg-[#FFE9DD]", text: "text-[#F45D2F]" },
      swiggy: { bg: "bg-[#FFEBDD]", text: "text-[#FF6D2E]" },
      food_panda: { bg: "bg-[#FFE7F3]", text: "text-[#F45CA0]" },
      uber_eats: { bg: "bg-[#E3F7EE]", text: "text-[#1D9F66]" },
      default: { bg: "bg-[#E8ECFF]", text: "text-[#6F70FF]" },
    }
    const providerStyle = providerPalette[providerKey] ?? providerPalette.default
    const channelOrderId =
      (order.meta?.orderId as string) ??
      (order.meta?.channelOrderId as string) ??
      (order.meta?.sourceOrderId as string) ??
      ""
    const customerName = order.customer?.name || "Guest"
    const addressLines = Array.isArray(order.address)
      ? order.address
      : [
          typeof order.address === "string" ? order.address : null,
          order.address?.street || order.address?.line1 || order.address?.address1 || order.address?.apartment,
          order.address?.city || order.address?.state,
          order.address?.country,
        ]
    const safeAddress = addressLines.filter(Boolean).slice(0, 2).join(", ")
    const amount =
      typeof order.totalPrice === "number"
        ? order.totalPrice
        : typeof order.amounts?.total === "number"
          ? order.amounts.total
          : typeof order.subtotal === "number"
            ? order.subtotal
            : 0
    const currency = order.currency ?? order.amounts?.currency ?? "USD"
    const paymentStatus = toTitleCase(order.paymentStatus ?? order.payment?.status ?? "Paid")
    const createdTime = formatTimeLabel(order.createdAt, lang)
    const duration = formatDuration(order.createdAt)
    const action = actionForOrder(order)
    const badgeLetter = brandName.slice(0, 1) || "B"
    const isActive = selectedOrderId === order.id || selectedOrderId === id
    const isWarning = ["in_progress", "processing", "preparing"].includes(normalizeStatus(order.status))

    return (
      <div
        key={order.id ?? id}
        onClick={() => handleOpenDetails(order.id ?? order.orderId ?? order._id ?? null)}
        className={cn(
          "cursor-pointer rounded-2xl bg-white p-3 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.35)] transition-all hover:shadow-lg",
          isActive && "ring-2 ring-[#0EBE7F]"
        )}
      >
        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[110px,110px,1.1fr,1fr,0.9fr,0.9fr,0.8fr]">
          <div className="flex flex-col text-sm text-[#1b1b1b]">
            <span className="font-semibold leading-tight">{id}</span>
            <span className="text-xs font-medium text-[#6F70FF]">View Order</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F4FF] text-sm font-semibold text-[#1B82E3]">
              {token}
            </div>
            <div className="text-xs text-muted-foreground leading-tight">
              <div className="font-semibold text-[#1b1b1b]">{brandName}</div>
              <div className="text-[11px] text-gray-500">{brandId}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold",
                providerStyle.bg,
                providerStyle.text
              )}
            >
              {badgeLetter}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-[#1b1b1b]">{providerName}</div>
              <div className="text-xs text-gray-500">{channelOrderId || id}</div>
            </div>
          </div>

          <div className="leading-tight text-sm text-[#1b1b1b]">
            <div className="font-semibold">{customerName}</div>
            <div className="max-h-[32px] overflow-hidden text-xs text-gray-500">
              {safeAddress || order.customer?.phone || "—"}
            </div>
          </div>

          <div className="leading-tight text-sm text-[#1b1b1b]">
            <div className={cn("font-semibold", isWarning && "text-[#FF6D2E]")}>{duration}</div>
            <div className="text-xs text-gray-500">{createdTime}</div>
          </div>

          <div className="leading-tight text-sm text-[#1b1b1b]">
            <div className="font-semibold">{formatCurrency(amount, currency, lang)}</div>
            <div className="text-xs text-gray-500">{paymentStatus}</div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              disabled={action.disabled}
              onClick={(event) => {
                event.stopPropagation()
                action.onClick?.()
              }}
              className={cn(
                "h-10 rounded-full px-4 text-sm font-semibold shadow-none transition-all",
                action.color,
                action.text,
                action.disabled && "opacity-70"
              )}
            >
              {action.label}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!restaurantSlug) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground" lang={lang} dir={direction}>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{strings.noRestaurantTitle}</h2>
          <p className="text-sm">{strings.noRestaurantSubtitle}</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground" lang={lang} dir={direction}>
        <div className="text-center space-y-3 max-w-sm">
          <h2 className="text-lg font-semibold text-foreground">{strings.errorTitle}</h2>
          <p className="text-sm">
            {error instanceof Error ? error.message : strings.failedBadge}
          </p>
          <Button onClick={() => mutate()} variant="outline">
            {strings.tryAgain}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#E6E6E6] p-3" lang={lang} dir={direction}>
      <div className="mx-auto flex w-full max-w-[1400px] gap-4">
        <aside className="flex w-full flex-col rounded-[18px] bg-white p-3 shadow-md md:w-[520px]">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-[#1b1b1b]">{restaurantName ?? strings.fallbackTitle}</div>
              {data?.restaurant?.subdomain && (
                <div className="text-xs text-gray-500">@{data.restaurant.subdomain}</div>
              )}
            </div>
            <div className="text-[11px] text-gray-500">{strings.liveRefresh}</div>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Enter token number or order ID to search"
                className="h-11 w-full rounded-full border border-gray-200 bg-[#F7F7F7] pl-9 pr-3 text-sm"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => mutate()}
              className="h-11 w-11 rounded-full bg-[#F3F3F3] text-[#1b1b1b] shadow-inner"
              title={strings.refresh}
            >
              <RefreshCw className={cn("h-5 w-5", isValidating && "animate-spin")} />
            </Button>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Switch id="auto-accept" checked={autoAccept} onCheckedChange={setAutoAccept} />
              <label htmlFor="auto-accept" className="font-semibold text-[#1b1b1b]">
                Online / Auto-accept
              </label>
            </div>
            <button
              onClick={() => setMuteAutoAccepted((prev) => !prev)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold shadow-inner",
                muteAutoAccepted ? "bg-[#F3F3F3] text-[#1b1b1b]" : "bg-[#FFF2E8] text-[#F45D2F]"
              )}
            >
              {muteAutoAccepted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              Mute
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {isLoading && !data ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray-500">{strings.liveRefresh}</div>
            ) : displayOrders.length ? (
              displayOrders.map((order) => renderOrderRow(order))
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-gray-500">{strings.noOrdersMatch}</div>
            )}
          </div>
        </aside>

        <main className="hidden flex-1 md:flex">
          {selectedOrder ? (
            <div className="flex w-full flex-col rounded-[18px] bg-white p-4 shadow-md">
              <OrderDetails
                order={selectedOrder}
                onUpdate={() => mutate()}
                lang={lang}
                dir={direction}
                onAccept={
                  ["pending", "queued"].includes(selectedStatus)
                    ? () => handleStatusChange(selectedOrder.id, "in_progress", "accept")
                    : undefined
                }
                onReady={
                  ["pending", "queued", "in_progress"].includes(selectedStatus)
                    ? () => handleStatusChange(selectedOrder.id, "ready", "ready")
                    : undefined
                }
                onDeliver={
                  ["ready", "in_progress"].includes(selectedStatus)
                    ? () => handleStatusChange(selectedOrder.id, "delivered", "deliver")
                    : undefined
                }
                onCancel={() => handleStatusChange(selectedOrder.id, "canceled", "cancel")}
                accepting={accepting}
                readying={readying}
                delivering={delivering}
                canceling={canceling}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[18px] bg-white text-muted-foreground shadow-md">
              {displayOrders.length ? strings.selectOrder : strings.noOrdersMatch}
            </div>
          )}
        </main>
      </div>

      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white md:hidden">
          <div className="flex items-center gap-2 border-b border-gray-200 p-3">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setIsDetailsOpen(false)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm font-semibold text-[#1b1b1b]">
              Order #{selectedOrder.orderId ?? selectedOrder.id}
            </div>
          </div>
          <div className="p-3">
            <OrderDetails
              order={selectedOrder}
              onUpdate={() => mutate()}
              lang={lang}
              dir={direction}
              onAccept={
                ["pending", "queued"].includes(selectedStatus)
                  ? () => handleStatusChange(selectedOrder.id, "in_progress", "accept")
                  : undefined
              }
              onReady={
                ["pending", "queued", "in_progress"].includes(selectedStatus)
                  ? () => handleStatusChange(selectedOrder.id, "ready", "ready")
                  : undefined
              }
              onDeliver={
                ["ready", "in_progress"].includes(selectedStatus)
                  ? () => handleStatusChange(selectedOrder.id, "delivered", "deliver")
                  : undefined
              }
              onCancel={() => handleStatusChange(selectedOrder.id, "canceled", "cancel")}
              accepting={accepting}
              readying={readying}
              delivering={delivering}
              canceling={canceling}
            />
          </div>
        </div>
      )}
    </div>
  )
}
