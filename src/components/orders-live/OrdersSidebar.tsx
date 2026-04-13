// src/components/dashboard/orders-live/OrdersSidebar.tsx
"use client"

import * as React from "react"
import { Bell, BellOff, RefreshCw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/locale"

type NormalizedOrder = {
  id: string
  orderId?: string
  orderNumber?: string 
  _id?: string
  createdAt?: string
  updatedAt?: string
  status?: string
  type?: string
  currency?: string
  totalPrice?: number
  customer?: { name?: string; phone?: string }
  address?: any
  meta?: Record<string, any>
  amounts?: { total?: number; currency?: string }
  payment?: { status?: string; method?: string }
  paymentStatus?: string
}

type Strings = {
  refresh: string
  liveRefresh: string
  noOrdersMatch: string
  fallbackTitle: string
  language: string
  searchPlaceholder: string
  autoAccept: string
  muteAutoAccepted: string
  updating: string
}

type PendingActions = Record<string, { accept?: boolean; ready?: boolean; deliver?: boolean; cancel?: boolean }>

type OrderAction = {
  label: string
  color: string
  textColor?: string
  disabled?: boolean
  action?: "accept" | "ready" | "deliver" | "completed"
}

function getOrderAction(status: string | undefined, lang: Locale): OrderAction {
  const s = String(status ?? "").toLowerCase()
  const isArabic = lang === "ar"

  switch (s) {
    case "pending":
    case "queued":
      return { label: isArabic ? "قبول" : "Accept", color: "bg-[#0EBE7F]", textColor: "text-white", action: "accept" }

    case "accepted":
    case "in_progress":
    case "preparing":
    case "processing":
      return { label: isArabic ? "جاهز" : "Ready", color: "bg-[#FF5C2B]", textColor: "text-white", action: "ready" }

    case "ready":
      return { label: isArabic ? "تسليم" : "Deliver", color: "bg-[#6F70FF]", textColor: "text-white", action: "deliver" }

    case "delivered":
    case "completed":
      return {
        label: isArabic ? "مكتمل" : "Completed",
        color: "bg-gray-200",
        textColor: "text-gray-600",
        disabled: true,
        action: "completed",
      }

    case "canceled":
    case "cancelled":
    case "rejected":
      return { label: isArabic ? "ملغي" : "Canceled", color: "bg-gray-200", textColor: "text-gray-600", disabled: true }

    default:
      return { label: isArabic ? "عرض" : "View", color: "bg-gray-100", textColor: "text-gray-700" }
  }
}

type Props = {
  className?: string
  lang: Locale
  setLang: (v: Locale) => void
  direction: "rtl" | "ltr"
  strings: Strings

  restaurantName: string
  subdomain?: string

  isLoading: boolean
  isValidating: boolean
  mutate: () => void | Promise<void>

  autoAccept: boolean
  setAutoAccept: (v: boolean) => void

  muteAutoAccepted: boolean
  setMuteAutoAccepted: React.Dispatch<React.SetStateAction<boolean>>

  searchTerm: string
  setSearchTerm: (v: string) => void

  orders: NormalizedOrder[]
  selectedOrderId: string | null
  onSelectOrder: (id: string) => void

  pendingActions: PendingActions
  onAction: (orderId: string, status: string, kind: "accept" | "ready" | "deliver" | "cancel") => void

  renderRow?: (order: NormalizedOrder) => React.ReactNode
  readOnly?: boolean
}

function getAddressText(address: any) {
  if (!address) return "—"
  if (typeof address === "string") return address

  const line1 =
    address.street || address.line1 || address.address1 || address.apartment || address.area || address.district
  const line2 = address.city || address.state
  return [line1, line2].filter(Boolean).join(", ") || "—"
}

const padTime = (value: number) => value.toString().padStart(2, "0")
const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`
}

export default function OrdersSidebar({
  className,
  lang,
  setLang,
  direction,
  strings,
  restaurantName,
  subdomain,
  isLoading,
  isValidating,
  mutate,
  autoAccept,
  setAutoAccept,
  muteAutoAccepted,
  setMuteAutoAccepted,
  searchTerm,
  setSearchTerm,
  orders,
  selectedOrderId,
  onSelectOrder,
  pendingActions,
  onAction,
  renderRow,
  readOnly = false,
}: Props) {
  const [now, setNow] = React.useState(() => Date.now())
  const muteLabel = lang === "ar" ? "كتم" : "Mute"

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <aside
      className={cn("flex w-full flex-col rounded-[18px] bg-white p-3 shadow-md md:w-[520px]", className)}
      dir={direction}
      lang={lang}
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-[#1b1b1b]">
            {restaurantName ?? strings.fallbackTitle}
          </div>
          {subdomain && <div className="text-xs text-gray-500">@{subdomain}</div>}
        </div>

        <div className="flex items-center gap-2">
          {/* Lang toggle */}
          <div className="hidden items-center gap-1 rounded-full bg-[#F3F3F3] p-1 text-xs font-semibold md:flex">
            <button
              onClick={() => setLang("ar")}
              className={cn("rounded-full px-3 py-1", lang === "ar" ? "bg-white shadow-sm" : "text-gray-600")}
              type="button"
              title={strings.language}
            >
              عربي
            </button>
          </div>

          <div className="text-[11px] text-gray-500">{strings.liveRefresh}</div>
        </div>
      </div>

      {/* Search + Refresh */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400",
              direction === "rtl" ? "right-3" : "left-3"
            )}
          />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={strings.searchPlaceholder}
            className={cn(
              "h-11 w-full rounded-full border border-gray-200 bg-[#F7F7F7] text-sm",
              direction === "rtl" ? "pr-9 pl-3" : "pl-9 pr-3"
            )}
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

      {!readOnly && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Switch id="auto-accept" checked={autoAccept} onCheckedChange={setAutoAccept} />
            <label htmlFor="auto-accept" className="font-semibold text-[#1b1b1b]">
              {strings.autoAccept}
            </label>
          </div>

          <button
            onClick={() => setMuteAutoAccepted((prev) => !prev)}
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold shadow-inner",
              muteAutoAccepted ? "bg-[#F3F3F3] text-[#1b1b1b]" : "bg-[#FFF2E8] text-[#F45D2F]"
            )}
            type="button"
          >
            {muteAutoAccepted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {muteLabel}
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">{strings.liveRefresh}</div>
        ) : orders.length ? (
          orders.map((order) => {
            const id = order.id ?? order.orderNumber ?? ""
            if (!id) return null

            // لو عايز تستخدم Row مخصص
            if (renderRow) return <React.Fragment key={id}>{renderRow(order)}</React.Fragment>

            const action = readOnly
              ? {
                  label: lang === "ar" ? "عرض" : "View",
                  color: "bg-gray-100",
                  textColor: "text-gray-600",
                  disabled: true,
                }
              : getOrderAction(order.status, lang)

            const isBusy =
              Boolean(pendingActions[id]?.accept) ||
              Boolean(pendingActions[id]?.ready) ||
              Boolean(pendingActions[id]?.deliver) ||
              Boolean(pendingActions[id]?.cancel)

            const amount =
              typeof order.totalPrice === "number"
                ? order.totalPrice
                : typeof order.amounts?.total === "number"
                  ? order.amounts.total
                  : 0

            const paymentStatus = order.payment?.status ?? order.paymentStatus ?? "Paid"
            const safeAddress = getAddressText(order.address)
            const createdAtMs = order.createdAt
              ? new Date(order.createdAt).getTime()
              : order.meta?.createdAt
                ? new Date(order.meta.createdAt as any).getTime()
                : NaN
            const statusLower = String(order.status ?? "").toLowerCase()
            const isPaused = statusLower === "delivered" || statusLower === "canceled" || statusLower === "cancelled"
            const updatedAtMs = order.updatedAt
              ? new Date(order.updatedAt).getTime()
              : order.meta?.updatedAt
                ? new Date(order.meta.updatedAt as any).getTime()
                : undefined
            const stopTime = isPaused ? updatedAtMs ?? createdAtMs ?? now : now
            const liveDurationMs = Number.isNaN(createdAtMs) ? NaN : Math.max(0, stopTime - createdAtMs)
            const liveDuration = Number.isNaN(liveDurationMs) ? "—:—:—" : formatDuration(liveDurationMs)
            const createdLabel = Number.isNaN(createdAtMs)
              ? "—"
              : new Date(createdAtMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            const isLate = !Number.isNaN(liveDurationMs) && liveDurationMs >= 30 * 60 * 1000
            const isWarning = !Number.isNaN(liveDurationMs) && liveDurationMs >= 15 * 60 * 1000 && liveDurationMs < 30 * 60 * 1000
            const durationColor = isLate ? "text-red-600" : isWarning ? "text-orange-500" : "text-gray-900"

            return (
              <div
                key={id}
                onClick={() => onSelectOrder(id)}
                className={cn(
                  "rounded-2xl transition-all overflow-hidden border border-gray-100",
                  selectedOrderId === id ? "ring-2 ring-orange-500" : "ring-0"
                )}
              >
                <div className="flex items-center justify-between bg-white px-6 py-4 cursor-pointer hover:bg-gray-50 shadow-sm">
                  {/* 1. ID */}
                  <div className="w-24">
                    <div className="text-sm font-bold text-gray-900">
                      {order.orderNumber ?? order.orderId ?? order.id}
                    </div>
                    <div className="text-[10px] text-gray-400">{lang === "ar" ? "عرض الطلب" : "View Order"}</div>
                  </div>

                 

                  {/* 3. Timer (placeholder دلوقتي) */}
                  <div className="w-28 text-center space-y-1">
                    <div className={cn("text-sm font-bold", durationColor)}>
                      {liveDuration}
                      {isLate && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-[2px] text-[10px] font-semibold text-red-700">
                          {lang === "ar" ? "متأخر" : "Late"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{createdLabel}</div>
                  </div>

                

                  {/* 5. Action */}
                  <div className="w-32 flex justify-end">
                    <button
                      disabled={readOnly || action.disabled || isBusy || !action.action}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (readOnly) return
                        if (!action.action) return
                        if (isBusy) return

                        if (action.action === "accept") onAction(order.id, "in_progress", "accept")
                        if (action.action === "ready") onAction(order.id, "ready", "ready")
                        if (action.action === "deliver") onAction(order.id, "delivered", "deliver")
                      }}
                      className={cn(
                        "px-8 py-2 rounded-xl font-bold text-sm transition-colors",
                        action.color,
                        action.textColor,
                        (action.disabled || isBusy || !action.action) && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {isBusy ? strings.updating : action.label}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">{strings.noOrdersMatch}</div>
        )}
      </div>
    </aside>
  )
}
