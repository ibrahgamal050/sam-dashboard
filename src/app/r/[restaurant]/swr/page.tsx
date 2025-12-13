"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { useParams } from "next/navigation"
import { Filter, ListFilter, RefreshCw, Search, SortAsc, SortDesc, X } from "lucide-react"

import { OrdersList } from "@/components/dashboard/orders/orders-list"
import { OrderDetails } from "@/components/dashboard/orders/order-details"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { getDirection, LOCALE_LABELS, Locale, resolveLocale } from "@/lib/locale"

const ORDER_TYPE_SOUNDS: Record<string, number> = {
  delivery: 480,
  pickup: 560,
  dine_in: 620,
  default: 440,
}

const DONE_STATUSES = new Set(["ready", "served", "completed", "delivered", "canceled", "rejected"])

const STATUS_FILTERS = [
  { value: "active", label: { en: "Active", ar: "نشط" } },
  { value: "pending", label: { en: "Pending", ar: "قيد الانتظار" } },
  { value: "in_progress", label: { en: "In progress", ar: "قيد التنفيذ" } },
  { value: "ready", label: { en: "Ready", ar: "جاهز" } },
  { value: "delivered", label: { en: "Delivered", ar: "تم التسليم" } },
  { value: "canceled", label: { en: "Canceled", ar: "ملغى" } },
  { value: "all", label: { en: "All", ar: "الكل" } },
]

const TYPE_FILTERS = [
  { value: "all", label: { en: "All types", ar: "كل الأنواع" } },
  { value: "delivery", label: { en: "Delivery", ar: "توصيل" } },
  { value: "pickup", label: { en: "Pickup", ar: "استلام" } },
  { value: "dine_in", label: { en: "Dine-in", ar: "داخل المطعم" } },
]

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
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false)
  const [autoAccept, setAutoAccept] = useState(false)
  const [muteAutoAccepted, setMuteAutoAccepted] = useState(true)
  const [statusFilter, setStatusFilter] = useState("active")
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest")
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

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? !DONE_STATUSES.has(status)
            : status === statusFilter

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
      setIsMobileDetailsOpen(false)
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
    <div className="flex h-screen bg-background" lang={lang} dir={direction}>
      <div className="w-full md:w-96 border-r border-border bg-card flex flex-col">
        <div className="p-3 md:p-4 border-b border-border flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex flex-col">
                <h1 className="text-base md:text-lg font-semibold text-foreground">
                  {restaurantName ?? strings.fallbackTitle}
                </h1>
                {data?.restaurant?.subdomain && (
                  <span className="text-xs text-muted-foreground">@{data.restaurant.subdomain}</span>
                )}
              </div>
              <button
                onClick={() => mutate()}
                className="p-1 hover:bg-accent rounded-md transition-colors flex-shrink-0"
                title={strings.refresh}
                aria-label={strings.refresh}
              >
                <RefreshCw className={`w-4 h-4 text-muted-foreground ${isValidating ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={lang} onValueChange={(value) => setLang(resolveLocale(value))}>
                <SelectTrigger className="w-[120px]" aria-label={strings.language}>
                  <SelectValue placeholder={strings.language} />
                </SelectTrigger>
                <SelectContent align={direction === "rtl" ? "end" : "start"}>
                  {(Object.keys(LOCALE_LABELS) as Locale[]).map((localeKey) => (
                    <SelectItem key={localeKey} value={localeKey}>
                      {LOCALE_LABELS[localeKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className={cn("flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
                <Switch id="auto-accept" checked={autoAccept} onCheckedChange={setAutoAccept} />
                <Label htmlFor="auto-accept" className="text-xs">
                  {strings.autoAccept}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                  direction === "rtl" ? "right-3" : "left-3",
                )}
              />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={strings.searchPlaceholder}
                className={cn(direction === "rtl" ? "pr-9" : "pl-9")}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <ListFilter
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    direction === "rtl" ? "ml-2" : "mr-2",
                  )}
                />
                <SelectValue placeholder={strings.statusPlaceholder} />
              </SelectTrigger>
              <SelectContent align={direction === "rtl" ? "end" : "start"}>
                {STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    direction === "rtl" ? "ml-2" : "mr-2",
                  )}
                />
                <SelectValue placeholder={strings.typePlaceholder} />
              </SelectTrigger>
              <SelectContent align={direction === "rtl" ? "end" : "start"}>
                {TYPE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDirection((prev) => (prev === "newest" ? "oldest" : "newest"))}
              title={
                sortDirection === "newest"
                  ? strings.sortTooltip.oldest
                  : strings.sortTooltip.newest
              }
            >
              {sortDirection === "newest" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
            </Button>
            <div className={cn("flex items-center gap-2", direction === "rtl" && "flex-row-reverse")}>
              <Switch
                id="mute-auto"
                checked={muteAutoAccepted}
                onCheckedChange={setMuteAutoAccepted}
                disabled={!autoAccept}
              />
              <Label htmlFor="mute-auto" className="text-xs text-muted-foreground">
                {strings.muteAutoAccepted}
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{strings.liveRefresh}</span>
            {error && (
              <span className={cn("text-destructive", direction === "rtl" ? "mr-1" : "ml-1")}>
                {strings.failedBadge}
              </span>
            )}
          </div>
        </div>

        <OrdersList
          orders={displayOrders}
          selectedOrderId={selectedOrderId ?? ""}
          onSelectOrder={(id) => {
            setSelectedOrderId(id)
            setIsMobileDetailsOpen(true)
          }}
          isLoading={isLoading && !data}
          lang={lang}
          dir={direction}
        />
      </div>

      <div className="hidden md:flex flex-1 flex-col">
        {selectedOrder ? (
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
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {displayOrders.length ? strings.selectOrder : strings.noOrdersMatch}
          </div>
        )}
      </div>

      {isMobileDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileDetailsOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full bg-background shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold">{strings.mobileDetailsTitle}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileDetailsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
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
