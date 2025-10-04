"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Timer, Maximize2, Minimize2, Wifi, WifiOff, Clock, Users, ChefHat, AlertTriangle } from "lucide-react"

type KitchenOrder = {
  orderId: string
  createdAt: string
  table?: string
  status: "pending" | "queued" | "in_progress" | "ready" | "served" | "canceled" | string
  items: { name: string; quantity: number }[]
}

export default function KitchenPage() {
  const { rid } = useParams() as { rid?: string }
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [connection, setConnection] = useState<"connecting" | "open" | "closed">("connecting")
  const [now, setNow] = useState(Date.now())
  const [includeReady, setIncludeReady] = useState(false)
  const abortRef = React.useRef<AbortController | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

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

  // Centralized active-orders fetch with race cancellation
  async function fetchActive() {
    if (!restaurantId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const url = `/api/orders?kitchen&restaurantId=${restaurantId}${includeReady ? '&includeReady=1' : ''}`
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!res.ok) return
      const data = await res.json()
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch (e) {
      // aborted or network error; ignore
    }
  }

  // Debounced refetch to coalesce bursts of SSE events
  function scheduleRefetch(delay = 350) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchActive()
    }, delay)
  }

  useEffect(() => {
    if (!restaurantId) return
    fetchActive()
    return () => {
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [restaurantId, includeReady])

  useEffect(() => {
    if (!restaurantId) return
    setConnection("connecting")
    const es = new EventSource(`/api/orders/stream?restaurantId=${restaurantId}`)
    es.onopen = () => setConnection("open")
    es.onerror = () => setConnection("closed")
    es.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.event === "order.created" || data.event === "order.updated") {
          // debounce multiple incoming events into one refetch
          scheduleRefetch(400)
        }
      } catch {}
    }
    return () => es.close()
  }, [restaurantId])

  // Resync when window regains focus or comes online
  useEffect(() => {
    function onFocus() { scheduleRefetch(0) }
    function onOnline() { scheduleRefetch(0) }
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  const view = useMemo(() => orders.filter((o) => o.status !== "ready"), [orders])

  async function updateStatus(orderId: string, status: KitchenOrder["status"]) {
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status } : o)))
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(restaurantId ? { "x-restaurant-id": restaurantId } : {}) },
      body: JSON.stringify({ status }),
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <RegisterSW />
      <RegisterKitchenManifest />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header connection={connection} includeReady={includeReady} setIncludeReady={setIncludeReady} />
        <main role="main" aria-label="Kitchen orders">
          <div
            className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            role="grid"
            aria-label={`${view.length} active orders`}
          >
            {view.map((o) => (
              <OrderCard key={o.orderId} o={o} now={now} onChangeStatus={updateStatus} />
            ))}
          </div>
          {view.length === 0 && <EmptyState connection={connection} />}
          <div aria-live="polite" aria-atomic="true" className="sr-only" aria-label="Order updates">
            {view.length} active orders
          </div>
        </main>
      </div>
    </div>
  )
}

function Header({ connection, includeReady, setIncludeReady }: { connection: "open" | "closed" | "connecting"; includeReady: boolean; setIncludeReady: (v: boolean) => void }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="mb-10">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-900/5 p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <ChefHat className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
                Kitchen Dashboard
              </h1>
            </div>
            <FullscreenToggle />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
              <Timer className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
              <time
                dateTime={new Date(now).toISOString()}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 font-mono"
              >
                {new Date(now).toLocaleTimeString()}
              </time>
            </div>
            <Button
              variant={includeReady ? 'secondary' : 'outline-solid'}
              size="sm"
              onClick={() => setIncludeReady(!includeReady)}
              className="h-10 px-4 font-semibold border-2"
              aria-pressed={includeReady}
              aria-label="Toggle showing ready orders"
            >
              {includeReady ? 'Include Ready' : 'Active Only'}
            </Button>
            <ConnectionStatus connection={connection} />
          </div>
        </div>
      </div>
    </header>
  )
}

function ConnectionStatus({ connection }: { connection: "open" | "closed" | "connecting" }) {
  const statusConfig = {
    open: {
      icon: Wifi,
      label: "Connected",
      variant: "default" as const,
      className:
        "border-emerald-200 bg-linear-to-r from-emerald-50 to-green-50 text-emerald-800 dark:border-emerald-700 dark:from-emerald-900/20 dark:to-green-900/20 dark:text-emerald-300 shadow-emerald-100/50 dark:shadow-emerald-900/20",
    },
    connecting: {
      icon: Wifi,
      label: "Connecting...",
      variant: "secondary" as const,
      className:
        "border-amber-200 bg-linear-to-r from-amber-50 to-yellow-50 text-amber-800 dark:border-amber-700 dark:from-amber-900/20 dark:to-yellow-900/20 dark:text-amber-300 shadow-amber-100/50 dark:shadow-amber-900/20",
    },
    closed: {
      icon: WifiOff,
      label: "Disconnected",
      variant: "destructive" as const,
      className:
        "border-red-200 bg-linear-to-r from-red-50 to-rose-50 text-red-800 dark:border-red-700 dark:from-red-900/20 dark:to-rose-900/20 dark:text-red-300 shadow-red-100/50 dark:shadow-red-900/20",
    },
  }

  const config = statusConfig[connection]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={`gap-3 px-4 py-2.5 shadow-lg ${config.className}`}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="font-semibold text-sm">{config.label}</span>
    </Badge>
  )
}

function OrderCard({
  o,
  now,
  onChangeStatus,
}: { o: KitchenOrder; now: number; onChangeStatus: (id: string, status: KitchenOrder["status"]) => void }) {
  const elapsed = Math.max(0, now - new Date(o.createdAt).getTime())
  const mm = Math.floor(elapsed / 60000)
  const ss = Math.floor((elapsed % 60000) / 1000)
  const late = elapsed > 12 * 60 * 1000
  const urgent = elapsed > 20 * 60 * 1000

  const statusConfig = {
    pending: {
      label: "Pending",
      color:
        "bg-linear-to-r from-slate-100 to-gray-100 text-slate-800 dark:from-slate-800 dark:to-gray-800 dark:text-slate-200 border-slate-200 dark:border-slate-600",
      cardBorder: "border-slate-200 dark:border-slate-700",
    },
    queued: {
      label: "Queued",
      color:
        "bg-linear-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-700",
      cardBorder: "border-blue-200 dark:border-blue-700",
    },
    in_progress: {
      label: "In Progress",
      color:
        "bg-linear-to-r from-amber-100 to-orange-100 text-amber-800 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-700",
      cardBorder: "border-amber-200 dark:border-amber-700",
    },
    ready: {
      label: "Ready",
      color:
        "bg-linear-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
      cardBorder: "border-emerald-200 dark:border-emerald-700",
    },
  }

  const currentStatus = statusConfig[o.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <Card
      className={`
        relative transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1 group
        ${
          urgent
            ? "ring-2 ring-red-400 shadow-xl shadow-red-100 dark:shadow-red-900/30 bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50"
            : late
              ? "ring-2 ring-orange-400 shadow-xl shadow-orange-100 dark:shadow-orange-900/30 bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50"
              : "hover:shadow-slate-200 dark:hover:shadow-slate-800/50 bg-linear-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/80"
        }
        ${currentStatus.cardBorder} border-2
      `}
      role="gridcell"
      aria-label={`Order ${o.orderId.slice(-6)}, ${o.items.length} items, ${mm} minutes ${ss} seconds elapsed`}
    >
      {urgent && (
        <div className="absolute -top-2 -right-2 flex items-center justify-center">
          <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse shadow-lg" aria-hidden="true" />
          <AlertTriangle className="absolute h-3 w-3 text-white" aria-hidden="true" />
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">#{o.orderId.slice(-6)}</h3>
            <Badge
              variant="outline"
              className={`${currentStatus.color} shadow-xs font-semibold px-3 py-1`}
              aria-label={`Status: ${currentStatus.label}`}
            >
              {currentStatus.label}
            </Badge>
          </div>

          <TimerBadge mm={mm} ss={ss} late={late} urgent={urgent} />
        </div>

        {o.table && (
          <div className="flex items-center gap-3 mt-3 px-3 py-2 bg-slate-100/80 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Table {o.table}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-5">
        <OrderItems items={o.items} />
        <div className="pt-2">
          <Button
            className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onChangeStatus(o.orderId, 'ready')}
            aria-label={`Mark order ${o.orderId.slice(-6)} as ready`}
          >
            ✅ جاهز
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const TimerBadge = React.memo(function TimerBadge({
  mm,
  ss,
  late,
  urgent,
}: { mm: number; ss: number; late: boolean; urgent: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`
        flex items-center gap-2 px-3 py-2 font-mono text-sm min-w-[80px] justify-center shadow-lg font-bold
        ${
          urgent
            ? "border-red-300 bg-linear-to-r from-red-100 to-rose-100 text-red-700 dark:border-red-600 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-300"
            : late
              ? "border-orange-300 bg-linear-to-r from-orange-100 to-amber-100 text-orange-700 dark:border-orange-600 dark:from-orange-900/40 dark:to-amber-900/40 dark:text-orange-300"
              : "border-slate-300 bg-linear-to-r from-slate-100 to-gray-100 text-slate-700 dark:border-slate-600 dark:from-slate-700 dark:to-gray-700 dark:text-slate-300"
        }
      `}
      role="timer"
      aria-label={`Order time: ${mm} minutes and ${ss} seconds${late ? ", running late" : ""}`}
    >
      <Clock className="h-4 w-4" aria-hidden="true" />
      <span className="text-base">
        {mm}:{ss.toString().padStart(2, "0")}
      </span>
    </Badge>
  )
})

function OrderItems({ items }: { items: { name: string; quantity: number }[] }) {
  const visibleItems = items.slice(0, 6)
  const remainingCount = items.length - 6

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 sr-only">
        Order items ({items.length} total)
      </h4>
      <ul className="space-y-2.5" role="list">
        {visibleItems.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-slate-900 dark:text-slate-100 leading-relaxed p-2 rounded-lg bg-slate-50/80 dark:bg-slate-700/30 border border-slate-200/60 dark:border-slate-600/40"
          >
            <span className="shrink-0 w-7 h-7 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {item.quantity}
            </span>
            <span className="break-words font-medium pt-0.5">{item.name}</span>
          </li>
        ))}
        {remainingCount > 0 && (
          <li className="text-sm text-slate-500 dark:text-slate-400 pl-10 py-1 font-medium">
            +{remainingCount} more item{remainingCount === 1 ? "" : "s"}
          </li>
        )}
      </ul>
    </div>
  )
}

// Removed status select; we use a single Ready button for faster workflow

function EmptyState({ connection }: { connection: "open" | "closed" | "connecting" }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center shadow-lg border border-blue-200 dark:border-blue-700">
          <Timer className="h-10 w-10 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">No active orders</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {connection === "open"
              ? "All caught up! New orders will appear here automatically when they come in."
              : "Check your connection. Orders will sync automatically when reconnected."}
          </p>
        </div>
      </div>
    </div>
  )
}

function FullscreenToggle() {
  const [fs, setFs] = useState(false)
  useEffect(() => {
    const handler = () => setFs(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  return (
    <Button
      variant={fs ? "secondary" : "outline-solid"}
      size="sm"
      onClick={() => (fs ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
      className={`gap-2 h-10 px-4 font-semibold shadow-lg transition-all duration-200 ${
        fs
          ? "bg-linear-to-r from-slate-100 to-gray-100 hover:from-slate-200 hover:to-gray-200 dark:from-slate-700 dark:to-gray-700 dark:hover:from-slate-600 dark:hover:to-gray-600"
          : "bg-linear-to-r from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 dark:from-slate-800 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-600 border-2 border-slate-200 dark:border-slate-600"
      }`}
      aria-label={fs ? "Exit fullscreen mode" : "Enter fullscreen mode"}
    >
      {fs ? (
        <>
          <Minimize2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Exit Fullscreen</span>
        </>
      ) : (
        <>
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Fullscreen</span>
        </>
      )}
    </Button>
  )
}

function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])
  return null
}

function RegisterKitchenManifest() {
  useEffect(() => {
    const link = document.createElement("link")
    link.rel = "manifest"
    link.href = "/manifest-kitchen.json"
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])
  return null
}
