"use client"

import { useEffect, useMemo, useRef, useState, useDeferredValue, useCallback } from "react"
import { useParams } from "next/navigation"
import { CalendarRange, DollarSign, RefreshCw, Search, Download, Loader2, PackageOpen } from "lucide-react"

import { OrdersTable, type Order as OrdersTableRow } from "@/components/dashboard/orders-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"



type OrderStatus = "On Delivery" | "Delivered" | "Canceled"
type OrderType = "Delivery" | "Pickup" | "Dine-in"

type ApiOrder = {
  orderId: string
  createdAt: string
  customer?: {
    name?: string
    phone?: string
    email?: string
  }
  status?: string
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  totalPrice?: number
}

interface Order {
  id: string
  createdAt: string
  customer: {
    name: string
    phone: string
    email: string
  }
  status: OrderStatus
  address?: string
  items: {
    name: string
    qty: number
    price: number
  }[]
  deliveryFee: number
  type: OrderType
}

const STATUS_FILTERS: Array<{ label: string; value: OrderStatus | "All" }> = [
  { label: "All", value: "All" },
  { label: "On delivery", value: "On Delivery" },
  { label: "Delivered", value: "Delivered" },
  { label: "Canceled", value: "Canceled" },
]

const PAGE_SIZE = 10

export default function OrdersPage() {
  const params = useParams()
  const { toast } = useToast()
  const subdomain = Array.isArray(params?.subdomain) ? params.subdomain[0] : (params?.subdomain as string) ?? ""

  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All")
  const [dateRange, setDateRange] = useState("Last 7 days")
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const abortRef = useRef<AbortController | null>(null)

  const resetPagination = () => setPage(1)

  useEffect(() => {
    resetPagination()
  }, [statusFilter, dateRange, deferredSearch])

  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    if (!subdomain) return []

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const doFetch = async () => {
      const restaurantRes = await fetch(`/api/restaurants/${subdomain}`, { signal: controller.signal })
      if (!restaurantRes.ok) throw new Error("Failed to resolve restaurant")
      const restaurant = await restaurantRes.json()
      const restaurantId = restaurant?._id
      if (!restaurantId) throw new Error("Restaurant id missing")

      const ordersRes = await fetch(`/api/orders?restaurantId=${restaurantId}`, { signal: controller.signal })
      if (!ordersRes.ok) throw new Error("Failed to fetch orders")
      const data = await ordersRes.json()

      const mapped: Order[] = (data.orders || []).map((order: ApiOrder) => {
        const items = (order.items || []).map((item) => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
        }))
        const itemsTotal = items.reduce((sum, item) => sum + item.qty * item.price, 0)
        const deliveryFee = Math.max((order.totalPrice ?? itemsTotal) - itemsTotal, 0)

        const normalizedStatus: OrderStatus = (() => {
          const raw = String(order.status || "pending").toLowerCase()
          if (["delivered", "served", "complete", "completed"].includes(raw)) return "Delivered"
          if (["canceled", "cancelled"].includes(raw)) return "Canceled"
          return "On Delivery"
        })()

        return {
          id: order.orderId,
          createdAt: order.createdAt,
          customer: {
            name: order.customer?.name || "Guest",
            phone: order.customer?.phone || "",
            email: order.customer?.email || "",
          },
          status: normalizedStatus,
          address: undefined,
          items,
          deliveryFee,
          type: "Delivery",
        }
      })
      return mapped
    }

    try {
      return await doFetch()
    } catch (e) {
      // retry once if aborted by network hiccup (not manual abort)
      if ((e as any)?.name !== "AbortError") {
        try {
          return await doFetch()
        } catch (err) {
          throw err
        }
      }
      throw e
    }
  }, [subdomain])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!subdomain) return
      try {
        setLoading(true)
        const mapped = await fetchOrders()
        if (!cancelled) setOrders(mapped)
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setOrders(demoOrders)
          toast({ title: "Using demo orders", description: "Could not fetch orders from the API." })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
  }, [subdomain, toast, fetchOrders])

  const now = Date.now()
  const minDate = useMemo(() => {
    if (dateRange === "Today") {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    if (dateRange === "Last 30 days") return now - 30 * 86400000
    return now - 7 * 86400000
  }, [dateRange, now])

  const statusCounts = useMemo(() => {
    const base = { all: 0, delivered: 0, onDelivery: 0, canceled: 0 }
    for (const o of orders) {
      // date guard to keep counts consistent with filter panel
      const created = new Date(o.createdAt).getTime()
      if (created < minDate) continue
      base.all += 1
      if (o.status === "Delivered") base.delivered += 1
      else if (o.status === "Canceled") base.canceled += 1
      else base.onDelivery += 1
    }
    return base
  }, [orders, minDate])

  const filteredOrders = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    return orders.filter((order) => {
      const created = new Date(order.createdAt).getTime()
      if (created < minDate) return false

      const matchesStatus = statusFilter === "All" || order.status === statusFilter
      if (!matchesStatus) return false

      if (!q) return true
      const haystack = [order.id, order.customer.name, order.customer.phone, order.customer.email]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [orders, deferredSearch, statusFilter, minDate])

  const tableOrders: OrdersTableRow[] = useMemo(() => {
    return filteredOrders.map((order) => {
      const itemsTotal = order.items.reduce((sum, item) => sum + item.qty * item.price, 0)
      const total = itemsTotal + (order.deliveryFee || 0)
      return {
        id: order.id,
        date: new Date(order.createdAt).toLocaleString(),
        customer: order.customer.name || "Guest",
        location: order.address || "—",
        amount: formatCurrency(total, "EGP"),
        status: order.status,
      }
    })
  }, [filteredOrders])

  const pageCount = Math.max(1, Math.ceil(tableOrders.length / PAGE_SIZE))
  const pageOrders = useMemo(
    () => tableOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [tableOrders, page]
  )

  const summary = useMemo(() => {
    const totals = orders.reduce(
      (acc, order) => {
        const itemsTotal = order.items.reduce((sum, item) => sum + item.qty * item.price, 0)
        const total = itemsTotal + order.deliveryFee
        acc.revenue += total
        acc.orders += 1
        if (order.status === "Delivered") acc.delivered += 1
        return acc
      },
      { revenue: 0, orders: 0, delivered: 0 },
    )

    return [
      {
        label: "Total revenue",
        value: formatCurrency(totals.revenue, "EGP"),
        icon: DollarSign,
      },
      {
        label: "Orders",
        value: `${totals.orders}`,
        icon: RefreshCw,
      },
      {
        label: "Delivered",
        value: `${totals.delivered}`,
        icon: CalendarRange,
      },
    ]
  }, [orders])

  const downloadCsv = () => {
    const rows = [
      ["ID", "Date", "Customer", "Phone", "Email", "Status", "Address", "Items", "Delivery Fee", "Total"],
      ...orders.map((o) => {
        const itemsTotal = o.items.reduce((sum, i) => sum + i.qty * i.price, 0)
        const total = itemsTotal + o.deliveryFee
        const itemsStr = o.items.map((i) => `${i.name} x${i.qty} @ ${i.price}`).join("; ")
        return [
          o.id,
          new Date(o.createdAt).toISOString(),
          o.customer.name,
          o.customer.phone,
          o.customer.email,
          o.status,
          o.address ?? "",
          itemsStr,
          String(o.deliveryFee),
          String(total),
        ]
      }),
    ]
    const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${subdomain}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Orders</h1>
          <p className="text-sm text-slate-500">Monitor live operations, delays, and customer activity.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Select value={dateRange} onValueChange={(v) => { setDateRange(v); }}>
            <SelectTrigger className="h-10 w-44 rounded-full border-slate-300 text-sm">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="Last 7 days">Last 7 days</SelectItem>
              <SelectItem value="Last 30 days">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={downloadCsv} variant="outline" className="gap-2 rounded-full border-slate-300 text-sm">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            Create order
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map((metric) => (
          <Card key={metric.label} className="border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-slate-200">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === filter.value
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {filter.label}
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-slate-500">
                    {filter.value === "All"
                      ? statusCounts.all
                      : filter.value === "Delivered"
                      ? statusCounts.delivered
                      : filter.value === "Canceled"
                      ? statusCounts.canceled
                      : statusCounts.onDelivery}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders or customers"
              className="h-10 rounded-full border-slate-300 pl-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading orders…
            </div>
          ) : pageOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center text-slate-500">
              <PackageOpen className="h-8 w-8" />
              <p className="text-sm">No orders match your filters.</p>
            </div>
          ) : (
            <>
              <OrdersTable orders={pageOrders} />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-medium text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span>
                  –<span className="font-medium text-slate-700">{Math.min(page * PAGE_SIZE, tableOrders.length)}</span>
                  
                  of <span className="font-medium text-slate-700">{tableOrders.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-slate-600">Page {page} / {pageCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("ar-EG", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function escapeCsv(val: string) {
  if (val == null) return ""
  const hasComma = /[",\n]/.test(val)
  const escaped = val.replace(/"/g, '""')
  return hasComma ? `"${escaped}"` : escaped
}

const demoOrders: Order[] = [
  {
    id: "ORD-1001",
    createdAt: new Date().toISOString(),
    customer: { name: "John Doe", phone: "555-1234", email: "john@example.com" },
    status: "On Delivery",
    address: "123 Main St, Springfield",
    items: [
      { name: "Burger", qty: 2, price: 8.5 },
      { name: "Fries", qty: 1, price: 3 },
    ],
    deliveryFee: 2.5,
    type: "Delivery",
  },
  {
    id: "ORD-1002",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    customer: { name: "Jane Smith", phone: "555-5678", email: "jane@example.com" },
    status: "Delivered",
    address: "In-store pickup",
    items: [
      { name: "Salad", qty: 1, price: 6 },
      { name: "Juice", qty: 1, price: 2.5 },
    ],
    deliveryFee: 0,
    type: "Pickup",
  },
  {
    id: "ORD-1003",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    customer: { name: "Ahmed Ali", phone: "555-9012", email: "ahmed@example.com" },
    status: "Canceled",
    address: "456 Elm St, Metropolis",
    items: [{ name: "Pizza", qty: 1, price: 12 }],
    deliveryFee: 3,
    type: "Delivery",
  },
]
