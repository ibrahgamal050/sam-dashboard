// src/components/dashboard/orders-live/OrderRow.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Locale = "en" | "ar"

export type NormalizedOrder = {
  id: string
  orderId?: string
  _id?: string
  status?: string
  type?: string
  createdAt?: string
  currency?: string
  totalPrice?: number
  subtotal?: number
  amounts?: { total?: number; currency?: string }
  payment?: { status?: string; method?: string }
  paymentStatus?: string
  customer?: { name?: string; phone?: string }
  address?: any
  meta?: Record<string, any>
}

type PendingActions = Record<string, { accept?: boolean; ready?: boolean; deliver?: boolean; cancel?: boolean }>

type ActionKind = "accept" | "ready" | "deliver" | "cancel"

type Props = {
  order: NormalizedOrder
  lang: Locale
  selected?: boolean

  pendingActions?: PendingActions
  onAction: (orderId: string, status: string, kind: ActionKind) => void
  onOpenDetails: (id: string) => void
}

const DONE_STATUSES = new Set(["ready", "served", "completed", "delivered", "canceled", "cancelled", "rejected"])

const normalizeStatus = (status?: string) => String(status ?? "").toLowerCase().replace(/[\s-]+/g, "_")

const toTitleCase = (value?: string) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

const formatTimeLabel = (value?: string, locale: Locale = "en") => {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(parsed)
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

const formatCurrency = (amount: number, currency: string, locale: Locale) => {
  const localeTag = locale === "ar" ? "ar-EG" : "en-US"
  const safeCurrency = currency?.toUpperCase?.() || "USD"
  try {
    return new Intl.NumberFormat(localeTag, { style: "currency", currency: safeCurrency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${safeCurrency}`
  }
}

function getProviderStyle(providerName: string) {
  const providerKey = normalizeStatus(providerName)
  const providerPalette: Record<string, { bg: string; text: string }> = {
    zomato: { bg: "bg-[#FFE9DD]", text: "text-[#F45D2F]" },
    swiggy: { bg: "bg-[#FFEBDD]", text: "text-[#FF6D2E]" },
    food_panda: { bg: "bg-[#FFE7F3]", text: "text-[#F45CA0]" },
    uber_eats: { bg: "bg-[#E3F7EE]", text: "text-[#1D9F66]" },
    default: { bg: "bg-[#E8ECFF]", text: "text-[#6F70FF]" },
  }
  return providerPalette[providerKey] ?? providerPalette.default
}

function actionForOrder(
  order: NormalizedOrder,
  pending: { ready?: boolean; deliver?: boolean } | undefined,
  onOpenDetails: (id: string) => void,
  onAction: (orderId: string, status: string, kind: ActionKind) => void
) {
  const status = normalizeStatus(order.status)
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
      onClick: () => onOpenDetails(order.id),
    }
  }

  if (["in_progress", "processing", "accepted", "preparing"].includes(status)) {
    return {
      label: pending?.ready ? "Updating..." : "Ready",
      color: "bg-[#FF6D2E]",
      text: "text-white",
      onClick: () => onAction(order.id, "ready", "ready"),
    }
  }

  if (status === "ready") {
    return {
      label: pending?.deliver ? "Updating..." : distance ?? "Arrived",
      color: "bg-gradient-to-r from-[#7C8AFF] to-[#5BC8FB]",
      text: "text-white",
      onClick: () => onAction(order.id, "delivered", "deliver"),
    }
  }

  if (["delivered", "completed"].includes(status)) {
    return { label: "Completed", color: "bg-gray-200", text: "text-gray-600", disabled: true as const }
  }

  if (["canceled", "cancelled", "rejected"].includes(status)) {
    return { label: "Canceled", color: "bg-gray-200", text: "text-gray-600", disabled: true as const }
  }

  return {
    label: "View",
    color: "bg-gray-200",
    text: "text-gray-700",
    onClick: () => onOpenDetails(order.id),
  }
}

export default function OrderRow({ order, lang, selected, pendingActions, onAction, onOpenDetails }: Props) {
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

  const providerStyle = getProviderStyle(providerName)

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

  const pending = pendingActions?.[order.id ?? ""] ?? {}
  const isWarning = ["in_progress", "processing", "preparing"].includes(normalizeStatus(order.status))
  const action = actionForOrder(order, pending, onOpenDetails, onAction)

  const badgeLetter = brandName.slice(0, 1) || "B"

  return (
    <div
      onClick={() => onOpenDetails(order.id ?? id)}
      className={cn(
        "cursor-pointer rounded-2xl bg-white p-3 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.35)] transition-all hover:shadow-lg",
        selected && "ring-2 ring-[#0EBE7F]"
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
          <div className="text-xs leading-tight text-muted-foreground">
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
          <button
            disabled={(action as any).disabled}
            onClick={(e) => {
              e.stopPropagation()
              action.onClick?.()
            }}
            className={cn(
              "h-10 rounded-full px-4 text-sm font-semibold shadow-none transition-all",
              action.color,
              action.text,
              (action as any).disabled && "opacity-70"
            )}
            type="button"
          >
            {action.label}
          </button>
        </div>
      </div>
    </div>
  )
}
