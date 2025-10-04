"use client"

import { useEffect, useCallback, useReducer, useState  } from "react"
import type { Order, Station } from "@/types/order"
import { KdsHeader } from "@/components/kds/kds-header"
import { StationTabs } from "@/components/kds/station-tabs"
import { Board } from "@/components/kds/board"
import { BottomMenu } from "@/components/kds/bottom-menu"
import { useKdsRouting } from "@/hooks/use-kds-routing"
import { useParams } from "next/navigation"

// State management for UI
interface KdsState {
  orders: Order[]
  fulfilledOrders: Order[]
  loading: boolean
  error: string | null
  lastEtag: string | null
}

type KdsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ORDERS"; payload: Order[] }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_ETAG"; payload: string }
  | { type: "UPDATE_ORDER"; payload: { id: string; updates: Partial<Order> } }
  | { type: "MOVE_TO_FULFILLED"; payload: string }
  | { type: "RECALL_ORDER"; payload: string }

function kdsReducer(state: KdsState, action: KdsAction): KdsState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ORDERS":
      return { ...state, orders: action.payload, loading: false, error: null }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "SET_ETAG":
      return { ...state, lastEtag: action.payload }
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id ? { ...order, ...action.payload.updates } : order,
        ),
      }
    case "MOVE_TO_FULFILLED":
      const orderToMove = state.orders.find((o) => o.id === action.payload)
      if (!orderToMove) return state

      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.payload),
        fulfilledOrders: [
          { ...orderToMove, status: "served" as const, fulfilledAt: new Date().toISOString() },
          ...state.fulfilledOrders.slice(0, 49), // Keep last 50
        ],
      }
    case "RECALL_ORDER":
      const orderToRecall = state.fulfilledOrders.find((o) => o.id === action.payload)
      if (!orderToRecall) return state

      return {
        ...state,
        fulfilledOrders: state.fulfilledOrders.filter((o) => o.id !== action.payload),
        orders: [{ ...orderToRecall, status: "in_progress" as const, fulfilledAt: undefined }, ...state.orders],
      }
    default:
      return state
  }
}

const stations: { name: Station; label: string }[] = [
  { name: "wings", label: "Wings" },
  { name: "burger", label: "Burger" },
  { name: "fries", label: "Fries" },
  { name: "potatoes", label: "Potatoes" },
  { name: "drinks", label: "Drinks" },
  { name: "expo", label: "Expo" },
]

export default function ExpediterPage() {
  const { currentState, navigateToStation, navigateToOrder, clearOrderSelection, toggleView } = useKdsRouting()
const [restaurantId, setRestaurantId] = useState<string | null>(null)
const { rid } = useParams() as { rid?: string }
  const [state, dispatch] = useReducer(kdsReducer, {
    orders: [],
    fulfilledOrders: [],
    loading: true,
    error: null,
    lastEtag: null,
  })

  const { station: activeStation, showAllDine, showRecentlyFulfilled, includeReady, orderId } = currentState
 useEffect(() => {
    ;(async () => {
      if (!rid) return
      const r = await fetch(`/api/restaurants/${rid}`)
      if (r.ok) {
        const data = await r.json()
        setRestaurantId(data._id)
      }
    })()
  }, [rid])
 
 const fetchOrders = useCallback(
  async (signal?: AbortSignal) => {
    try {
      if (!restaurantId) return

      // 1) بنبني الاستعلام كله هنا ونستخدمه فعليًا
      const params = new URLSearchParams({
        kitchen: "1",
        restaurantId,
        station: showAllDine ? "all" : activeStation, // wings/burger/... أو all
        includeReady: includeReady ? "1" : "0",
      })

      const headers: HeadersInit = {}
      if (state.lastEtag) headers["If-None-Match"] = state.lastEtag

      const url = `/api/orders?${params.toString()}`
      console.log("[v0] Fetching orders:", url)

      const response = await fetch(url, {
        headers,
        signal,
        cache: "no-store",
      })

      if (response.status === 304) {
        console.log("[v0] Orders not modified (304)")
        return
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`)
      }

      // 2) خزّن الـ ETag لو موجود
      const etag = response.headers.get("ETag")
      if (etag) dispatch({ type: "SET_ETAG", payload: etag })

      // 3) استخرج الداتا بأمان
      const data = await response.json()
      const rawOrders: any[] =
        Array.isArray(data) ? data : Array.isArray((data as any)?.orders) ? (data as any).orders : []

      // 4) مُوحّدات الحالة والنوع
      const normalizeStatus = (s: any): Order["status"] => {
        const v = String(s ?? "").toLowerCase()
        if (v === "queued" || v === "new" || v === "paid") return "pending"
        if (v === "in_progress" || v === "in progress" || v === "inprogress") return "in_progress"
        if (v === "ready") return "ready"
        if (v === "served" || v === "completed") return "served"
        if (v === "canceled" || v === "rejected" || v === "cancelled") return "canceled"
        return "pending"
      }

      const normalizeType = (t: any): Order["type"] => {
        const v = String(t ?? "").toLowerCase()
        if (v === "dinein" || v === "dine-in" || v === "dine_in") return "dine_in"
        if (v === "pickup" || v === "pick-up" || v === "takeaway") return "takeaway"
        return "delivery"
      }

      // 5) تطبيع الأوردرات + حماية القيم
      const orders: Order[] = rawOrders.map((o: any, idx: number) => {
        const createdAt = o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString()

        // استخدم etaMinutes من السيرفر لو موجود، وإلا احسبها
        const etaMinutes =
          typeof o.etaMinutes === "number"
            ? Math.max(1, Math.round(o.etaMinutes))
            : o.eta
            ? Math.max(
                1,
                Math.round((new Date(o.eta).getTime() - new Date(createdAt).getTime()) / 60000),
              )
            : undefined

        // لو السيرفر بيرجع station استخدمه، وإلا fallback إلى "expo"
        const station =
          (typeof o.station === "string" && o.station) ? (o.station as Station) : ("expo" as Station)

        // رقم العرض: خليه ثابتًا لو السيرفر بيديه، وإلا idx+1
        const displayNumber =
          o.number ?? o.displayNumber ?? (typeof o.orderNumber === "number" ? o.orderNumber : idx + 1)

        return {
          id: String(o.orderId ?? o._id ?? o.id ?? idx),
          number: displayNumber,
          table: o.table ?? undefined,
          type: normalizeType(o.type),
          createdAt,
          etaMinutes,
          status: normalizeStatus(o.status),
          items: Array.isArray(o.items)
            ? o.items.map((it: any, ii: number) => ({
                id: String(it.productId ?? it.id ?? `${idx}-${ii}`),
                name: String(it.name ?? "Item"),
                qty: Number(it.quantity ?? it.qty ?? 1),
                course: "ENTREE",
                modifiers: Array.isArray(it.modifiers) ? it.modifiers : undefined,
                tags: undefined,
              }))
            : [],
          notes: o.notes ?? undefined,
          station,
          priority: (o.priority as Order["priority"]) ?? "normal",
          fulfilledAt: undefined,
        }
      })

      dispatch({ type: "SET_ORDERS", payload: orders })
      console.log("[v0] Orders loaded:", orders.length)
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return
      console.error("[v0] Fetch orders error:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load orders. Retrying..." })

      // إعادة محاولة خفيفة (مع احترام الإلغاء)
      setTimeout(() => {
        if (!signal?.aborted) fetchOrders(signal)
      }, 5000)
    }
  },
  [activeStation, showAllDine, includeReady, state.lastEtag, restaurantId]
)


  useEffect(() => {
    const controller = new AbortController()

    fetchOrders(controller.signal)

    const interval = setInterval(() => {
      fetchOrders(controller.signal)
    }, 10000) // Poll every 10 seconds

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchOrders])

  const handleStatusChange = useCallback(
    async (orderId: string, status: Order["status"]) => {
      console.log("[v0] Status change:", { orderId, status })

      if (status === "served") {
        dispatch({ type: "MOVE_TO_FULFILLED", payload: orderId })
        if (currentState.orderId === orderId) {
          clearOrderSelection()
        }
      } else {
        dispatch({ type: "UPDATE_ORDER", payload: { id: orderId, updates: { status } } })
      }

      try {
        if (!restaurantId) {
          throw new Error("Missing restaurantId for auth header")
        }
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-restaurant-id": restaurantId,
          },
          body: JSON.stringify({ status }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update order: ${response.status}`)
        }

        console.log("[v0] Order status updated successfully")
      } catch (error) {
        console.error("[v0] Failed to update order:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to update order. Changes may not be saved." })

        setTimeout(() => {
          fetchOrders()
        }, 1000)
      }
    },
    [currentState.orderId, clearOrderSelection, fetchOrders],
  )

  const handleRecall = useCallback(
    async (orderId: string) => {
      console.log("[v0] Recalling order:", orderId)
      dispatch({ type: "RECALL_ORDER", payload: orderId })

      try {
        if (!restaurantId) {
          throw new Error("Missing restaurantId for auth header")
        }
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-restaurant-id": restaurantId,
          },
          body: JSON.stringify({ status: "in_progress" }),
        })

        if (!response.ok) {
          throw new Error(`Failed to recall order: ${response.status}`)
        }

        console.log("[v0] Order recalled successfully")
      } catch (error) {
        console.error("[v0] Failed to recall order:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to recall order" })
      }
    },
    [fetchOrders, restaurantId],
  )

  const handleOrderClick = useCallback(
    (orderId: string) => {
      if (currentState.orderId === orderId) {
        clearOrderSelection()
      } else {
        navigateToOrder(orderId)
      }
    },
    [currentState.orderId, navigateToOrder, clearOrderSelection],
  )

  const filteredOrders = showRecentlyFulfilled ? state.fulfilledOrders : state.orders
  const safeOrders = Array.isArray(filteredOrders) ? filteredOrders : []
  const sortedOrders = [...safeOrders].sort((a, b) => {
    const statusPriority = { in_progress: 0, pending: 1, ready: 2, served: 3, canceled: 4 }
    const aPriority = statusPriority[a.status] ?? 5
    const bPriority = statusPriority[b.status] ?? 5

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const stationCounts = stations.map((station) => ({
    ...station,
    count: (Array.isArray(state.orders) ? state.orders : [])
      .filter((order) => order.station === station.name && (!showAllDine || order.type === "dine_in"))
      .length,
  }))

  const readyCount = (Array.isArray(state.orders) ? state.orders : []).filter((order) => order.status === "ready").length
  const totalCount = sortedOrders.length

  if (state.loading && (!Array.isArray(state.orders) || state.orders.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
    

    

     
      <div className="flex-1 pb-20">
        <Board
          orders={sortedOrders}
          selectedOrderId={orderId}
          onStatusChange={handleStatusChange}
          onRecall={handleRecall}
          onOrderClick={handleOrderClick}
          showRecall={showRecentlyFulfilled}
        />
      </div>

      <BottomMenu readyCount={readyCount} fulfilledCount={state.fulfilledOrders.length} />

      {state.error && (
        <div className="fixed bottom-24 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg animate-in slide-in-from-bottom-2 z-50">
          <div className="flex items-center gap-2">
            <span>{state.error}</span>
            <button
              onClick={() => dispatch({ type: "SET_ERROR", payload: null })}
              className="text-destructive-foreground/80 hover:text-destructive-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
