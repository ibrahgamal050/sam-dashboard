"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Order } from "@/types/order"
import { Board } from "@/components/kds/board"
import { useParams } from "next/navigation"
import { BottomMenu } from "@/components/kds/bottom-menu"


type HistoryState = {
  orders: Order[]
  loading: boolean
  error: string | null
  nextCursor: string | null
}

export default function HistoryPage() {
  const { rid } = useParams() as { rid?: string }
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [state, setState] = useState<HistoryState>({ orders: [], loading: true, error: null, nextCursor: null })

  useEffect(() => {
    ;(async () => {
      if (!rid) return
      try {
        const r = await fetch(`/api/restaurants/${rid}`)
        if (!r.ok) throw new Error(`Failed to load restaurant: ${r.status}`)
        const data = await r.json()
        setRestaurantId(data._id)
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: "Failed to load restaurant" }))
      }
    })()
  }, [rid])

  const normalizeStatus = (s: any): Order["status"] => {
    const v = String(s || "").toLowerCase()
    if (v === "queued" || v === "new" || v === "paid") return "pending"
    if (v === "in_progress" || v === "in progress" || v === "inprogress") return "in_progress"
    if (v === "ready") return "ready"
    if (v === "served" || v === "completed") return "served"
    if (v === "canceled" || v === "rejected" || v === "cancelled") return "canceled"
    return "pending"
  }

  const normalizeType = (t: any): Order["type"] => {
    const v = String(t || "").toLowerCase()
    if (v === "dinein" || v === "dine-in" || v === "dine_in") return "dine_in"
    if (v === "pickup" || v === "pick-up" || v === "takeaway") return "takeaway"
    return "delivery"
  }

  const mapToOrder = useCallback((raw: any, indexBase = 0): Order[] => {
    const src = Array.isArray(raw) ? raw : Array.isArray(raw?.orders) ? raw.orders : []
    return src.map((o: any, idx: number) => {
      const createdAt = o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString()
      const etaMinutes = o.eta
        ? Math.max(1, Math.round((new Date(o.eta).getTime() - new Date(createdAt).getTime()) / 60000))
        : undefined
      return {
        id: String(o.orderId ?? o._id ?? o.id ?? idx + indexBase),
        number: idx + 1 + indexBase,
        table: o.table ?? undefined,
        type: normalizeType(o.type),
        createdAt,
        etaMinutes,
        status: normalizeStatus(o.status),
        items: Array.isArray(o.items)
          ? o.items.map((it: any, ii: number) => ({
              id: String(it.productId ?? it.id ?? `${idx + indexBase}-${ii}`),
              name: String(it.name ?? "Item"),
              qty: Number(it.quantity ?? it.qty ?? 1),
              course: "ENTREE",
              modifiers: Array.isArray(it.modifiers) ? it.modifiers : undefined,
              tags: undefined,
            }))
          : [],
        notes: o.notes ?? undefined,
        station: "expo",
        priority: "normal",
        fulfilledAt: undefined,
      }
    })
  }, [])

  const fetchOrders = useCallback(
    async (cursor?: string) => {
      if (!restaurantId) return
      try {
        setState((s) => ({ ...s, loading: true, error: null }))
        const url = new URL(`/api/orders`, window.location.origin)
        url.searchParams.set("restaurantId", restaurantId)
        url.searchParams.set("status", "served")
        url.searchParams.set("limit", "24")
        if (cursor) url.searchParams.set("cursor", cursor)
        const res = await fetch(url.toString(), { headers: { "Cache-Control": "no-store" } })
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
        const data = await res.json()
        const mapped = mapToOrder(data, state.orders.length)
        const nextCursor = data?.nextCursor ?? null
        setState((s) => ({
          ...s,
          orders: cursor ? [...s.orders, ...mapped] : mapped,
          nextCursor,
          loading: false,
          error: null,
        }))
      } catch (e) {
        console.error("[history] fetch error", e)
        setState((s) => ({ ...s, loading: false, error: "Failed to load history" }))
      }
    },
    [restaurantId, mapToOrder, state.orders.length],
  )

  useEffect(() => {
    if (restaurantId) fetchOrders()
  }, [restaurantId, fetchOrders])

  const handleRecall = useCallback(
    async (orderId: string) => {
      // optimistic: remove from history list
      setState((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== orderId) }))
      try {
        if (!restaurantId) throw new Error("Missing restaurantId")
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-restaurant-id": restaurantId,
          },
          body: JSON.stringify({ status: "in_progress" }),
        })
        if (!res.ok) throw new Error(`Recall failed: ${res.status}`)
      } catch (e) {
        console.error("[history] recall error", e)
        // on failure, just refetch to restore
        fetchOrders()
        setState((s) => ({ ...s, error: "Failed to recall order" }))
      }
    },
    [restaurantId, fetchOrders],
  )

  const content = useMemo(() => {
    if (state.loading && state.orders.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading history…</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-3 border-b bg-background flex items-center justify-between">
          <h1 className="text-xl font-semibold">Recently Served</h1>
          <div className="text-sm text-muted-foreground">{state.orders.length} orders</div>
        </div>

        <div className="flex-1">
          <Board orders={state.orders} onStatusChange={() => {}} onRecall={handleRecall} showRecall />
        </div>

        <div className="px-6 py-4 flex items-center justify-center gap-3">
          {state.nextCursor && (
            <button
              className="px-4 py-2 rounded bg-muted hover:bg-muted/80 text-sm"
              onClick={() => fetchOrders(state.nextCursor!)}
              disabled={state.loading}
            >
              {state.loading ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
        <BottomMenu />

        {state.error && (
          <div className="fixed bottom-6 right-6 bg-destructive text-destructive-foreground px-4 py-2 rounded shadow">
            {state.error}
          </div>
        )}
      </div>
       
    )
  }, [state.loading, state.orders, state.nextCursor, state.error, handleRecall, fetchOrders])

  return <div className="min-h-screen bg-background flex flex-col">{content}</div>
}

