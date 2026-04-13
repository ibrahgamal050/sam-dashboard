"use client"

import { useMemo } from "react"

import { cn } from "@/lib/utils"
import { getDirection, Locale } from "@/lib/locale"

interface OrderListItem {
  id?: string
  orderId?: string
  _id?: string
  total?: number
  totalPrice?: number
  subtotal?: number
  price?: number
  currency?: string
  status?: string
  type?: string
  count?: number
  items?: Array<{ quantity?: number }>
  payment?: { method?: string }
  meta?: Record<string, any>
  createdAt?: string
}

const LIST_STRINGS: Record<
  Locale,
  {
    loading: string
    uncategorized: string
    orderLabel: string
  }
> = {
  en: {
    loading: "Loading...",
    uncategorized: "Uncategorized",
    orderLabel: "Order",
  },
  ar: {
    loading: "جاري التحميل...",
    uncategorized: "غير مصنف",
    orderLabel: "طلب",
  },
}

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    pending: "Pending",
    queued: "Queued",
    in_progress: "In progress",
    processing: "Processing",
    ready: "Ready",
    delivered: "Delivered",
    completed: "Completed",
    canceled: "Canceled",
    cancelled: "Canceled",
  },
  ar: {
    pending: "قيد الانتظار",
    queued: "قيد الانتظار",
    in_progress: "قيد التنفيذ",
    processing: "قيد المعالجة",
    ready: "جاهز",
    delivered: "تم التسليم",
    completed: "مكتمل",
    canceled: "ملغى",
    cancelled: "ملغى",
  },
}

const TYPE_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    delivery: "Delivery",
    pickup: "Pickup",
    dine_in: "Dine-in",
    takeaway: "Takeaway",
  },
  ar: {
    delivery: "توصيل",
    pickup: "استلام",
    dine_in: "داخل المطعم",
    takeaway: "تيك أواي",
  },
}

const PAYMENT_METHOD_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    cash: "Cash",
    cod: "Cash on delivery",
    card: "Card",
    online: "Online",
    wallet: "Wallet",
    meelza_pay: "Meelza Pay",
    meelzapay: "Meelza Pay",
  },
  ar: {
    cash: "نقدًا",
    cod: "دفع عند الاستلام",
    card: "بطاقة",
    online: "أونلاين",
    wallet: "محفظة",
    meelza_pay: "محفظة ميلزا",
    meelzapay: "محفظة ميلزا",
  },
}

interface OrdersListProps {
  orders: OrderListItem[]
  selectedOrderId: string
  onSelectOrder: (id: string) => void
  isLoading: boolean
  lang?: Locale
  dir?: "ltr" | "rtl"
}

const fallbackCurrency = "USD"

const toTitle = (value?: string) => {
  if (!value) return undefined
  return value
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const formatAmount = (amount: number, currency: string, locale: Locale) => {
  const localeTag = locale === "ar" ? "ar-EG" : "en-US"
  const safeCurrency = currency.toUpperCase()
  try {
    return new Intl.NumberFormat(localeTag, { style: "currency", currency: safeCurrency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${safeCurrency}`
  }
}

const computeItemCount = (order: OrderListItem) => {
  if (typeof order.count === "number" && Number.isFinite(order.count)) return order.count
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.reduce((acc, item) => acc + (Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1), 0)
  }
  return 0
}

export function OrdersList({
  orders,
  selectedOrderId,
  onSelectOrder,
  isLoading,
  lang = "en",
  dir,
}: OrdersListProps) {
  const strings = LIST_STRINGS[lang] ?? LIST_STRINGS.en
  const direction = dir ?? getDirection(lang)
  const textStart = direction === "rtl" ? "text-right" : "text-left"
  const textEnd = direction === "rtl" ? "text-left" : "text-right"

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-muted-foreground" dir={direction} lang={lang}>
          {strings.loading}
        </div>
      </div>
    )
  }

  const normalized = useMemo(() => {
    return orders
      .map((order) => {
        const id = order.id ?? order.orderId ?? order._id
        if (!id) return null
        const amount =
          typeof order.totalPrice === "number"
            ? order.totalPrice
            : typeof order.total === "number"
              ? order.total
              : typeof order.price === "number"
                ? order.price
                : typeof order.subtotal === "number"
                  ? order.subtotal
                  : 0
        const currency = order.currency ?? fallbackCurrency
        const statusKey = String(order.status ?? "pending").toLowerCase().replace(/[\s-]+/g, "_")
        const typeKey = String(order.type ?? "").toLowerCase().replace(/[\s-]+/g, "_")
        const paymentKey = String(order.payment?.method ?? "").toLowerCase().replace(/[\s-]+/g, "_")
        const statusLabel =
          STATUS_LABELS[lang]?.[statusKey] ??
          STATUS_LABELS.en?.[statusKey] ??
          toTitle(order.status === undefined ? "pending" : String(order.status))
        const typeLabel = TYPE_LABELS[lang]?.[typeKey] ?? TYPE_LABELS.en?.[typeKey] ?? toTitle(order.type)
        const paymentLabel =
          PAYMENT_METHOD_LABELS[lang]?.[paymentKey] ??
          PAYMENT_METHOD_LABELS.en?.[paymentKey] ??
          toTitle(order.payment?.method)
        const metaChannel = toTitle(
          typeof order.meta?.channel === "string" ? order.meta?.channel : (order.meta?.provider as string | undefined)
        )
        const infoLine = [typeLabel, paymentLabel, metaChannel].filter(Boolean).join(" • ")
        const createdAt = order.createdAt ? new Date(order.createdAt) : null
        const createdTime =
          createdAt && !Number.isNaN(createdAt.getTime())
            ? new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(createdAt)
            : undefined
        return {
          id: String(id),
          amount,
          currency,
          statusLabel,
          infoLine,
          createdTime,
          itemCount: computeItemCount(order),
        }
      })
      .filter(Boolean) as Array<{
      id: string
      amount: number
      currency: string
      statusLabel: string
      infoLine?: string
      createdTime?: string
      itemCount: number
    }>
  }, [orders, lang])

  return (
    <div className="flex-1 overflow-y-auto" lang={lang} dir={direction}>
      <div className="space-y-2 p-2">
        {normalized.map((order) => (
          <button
            key={order.id}
            onClick={() => onSelectOrder(order.id)}
            className={cn(
              "w-full rounded-lg border p-3 transition-all",
              selectedOrderId === order.id
                ? "bg-accent border-primary shadow-sm"
                : "bg-card border-border hover:bg-accent/50",
            )}
          >
            <div className="flex items-start justify-between gap-3" dir={direction}>
              <div className="min-w-0 flex-1">
                <div className={cn("mb-1 flex items-center gap-2", textStart)}>
                  <div className="text-lg font-semibold text-foreground">
                    {formatAmount(order.amount, order.currency, lang)}
                  </div>
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground">{order.statusLabel}</span>
                </div>
                <div className={cn("mb-1 text-xs text-muted-foreground", textStart)}>
                  {strings.orderLabel} № {order.id}
                </div>
                <div className={cn("text-xs text-muted-foreground", textStart)}>
                  {order.infoLine || strings.uncategorized}
                  {order.createdTime ? ` • ${order.createdTime}` : ""}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning">
                  <span className="text-sm font-semibold text-warning-foreground">{order.itemCount}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
