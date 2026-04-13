// src/app/r/[restaurant]/orders/history/page.tsx
"use client"

import useSWR from "swr"
import { useMemo } from "react"
import { useParams } from "next/navigation"
import { fetchOrdersForRestaurant } from "@/components/orders-live/utils/orders-mappers"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  queued: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  ready: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  served: "bg-green-100 text-green-800",
  canceled: "bg-gray-200 text-gray-700",
  cancelled: "bg-gray-200 text-gray-700",
  rejected: "bg-red-100 text-red-800",
}

const formatDate = (value?: string) => {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

export default function OrdersHistoryPage() {
  const params = useParams<{ restaurant?: string | string[] }>()
  const rawSlug = Array.isArray(params?.restaurant) ? params.restaurant?.[0] : params?.restaurant
  const restaurantSlug = useMemo(() => (rawSlug ?? "").trim().toLowerCase(), [rawSlug])

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    restaurantSlug ? (["orders-history", restaurantSlug] as const) : null,
    fetchOrdersForRestaurant,
    { revalidateOnFocus: true, refreshInterval: 10000 }
  )

  const orders = data?.orders ?? []
  const restaurantName = data?.restaurant?.name?.en ?? data?.restaurant?.name?.ar ?? restaurantSlug

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{restaurantName || "Order History"}</h1>
            <p className="text-sm text-muted-foreground">Order history (read-only) — latest 50 orders.</p>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border hover:bg-muted disabled:opacity-60"
            type="button"
          >
            {isValidating ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Failed to load orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Unknown error"}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading orders...</CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No orders found.</CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">Recent orders</CardTitle>
              <div className="text-xs text-muted-foreground">{orders.length} orders</div>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {orders.map((order) => {
                const status = String(order.status ?? "pending").toLowerCase()
                const badgeClass = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-800"
                const orderLabel = order.orderNumber ?? order.orderId ?? order.id
                const total =
                  typeof order.totalPrice === "number"
                    ? order.totalPrice
                    : typeof order.amounts?.total === "number"
                      ? order.amounts.total
                      : 0
                return (
                  <div key={order.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">#{orderLabel}</span>
                        <Badge className={badgeClass}>{status}</Badge>
                        {order.type && (
                          <Badge variant="outline" className="border-dashed">
                            {order.type}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatDate(order.createdAt)}</div>
                    </div>

                    <Separator className="sm:hidden" />

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:w-64 sm:justify-end">
                      <span className="font-semibold text-foreground">{total.toFixed(2)} {order.currency ?? "USD"}</span>
                      {order.customer?.name && <span className="text-xs">• {order.customer.name}</span>}
                      {order.payment?.status && (
                        <Badge variant="outline" className="ml-1">
                          {order.payment.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
