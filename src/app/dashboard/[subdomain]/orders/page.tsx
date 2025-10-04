"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { CalendarRange, DollarSign, RefreshCw, Search } from "lucide-react"

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

export default function OrdersPage() {
  const params = useParams()
  const { toast } = useToast()
  const subdomain = Array.isArray(params?.subdomain) ? params.subdomain[0] : (params?.subdomain as string) ?? ""

  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All")
  const [dateRange, setDateRange] = useState("Last 7 days")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadOrders = async () => {
      if (!subdomain) return
      try {
        setLoading(true)
        const restaurantRes = await fetch(`/api/restaurants/${subdomain}`)
        if (!restaurantRes.ok) throw new Error("Failed to resolve restaurant")
        const restaurant = await restaurantRes.json()
        const restaurantId = restaurant?._id
        if (!restaurantId) throw new Error("Restaurant id missing")

        const ordersRes = await fetch(`/api/orders?restaurantId=${restaurantId}`)
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

        if (!cancelled) {
          setOrders(mapped)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setOrders(demoOrders)
          toast({
            title: "Using demo orders",
            description: "Could not fetch orders from the API.",
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      cancelled = true
    }
  }, [subdomain, toast])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "All" || order.status === statusFilter
      if (!matchesStatus) return false

      if (!search.trim()) return true
      const haystack = [order.id, order.customer.name, order.customer.phone, order.customer.email]
        .join(" ")
        .toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
  }, [orders, search, statusFilter])

  const tableOrders: OrdersTableRow[] = useMemo(() => {
    return filteredOrders.map((order) => {
      const itemsTotal = order.items.reduce((sum, item) => sum + item.qty * item.price, 0)
      const total = itemsTotal + (order.deliveryFee || 0)
      return {
        id: order.id,
        date: new Date(order.createdAt).toLocaleString(),
        customer: order.customer.name || "Guest",
        location: order.address || "—",
        amount: `${total.toFixed(2)} EGP`,
        status: order.status,
      }
    })
  }, [filteredOrders])

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
        value: `${totals.revenue.toFixed(2)} EGP`,
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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Orders</h1>
          <p className="text-sm text-slate-500">Monitor live operations, delays, and customer activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-10 w-44 rounded-full border-slate-300 text-sm">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="Last 7 days">Last 7 days</SelectItem>
              <SelectItem value="Last 30 days">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
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
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders or customers"
              className="h-10 rounded-full border-slate-300 pl-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading orders…</div>
          ) : tableOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No orders in this range.</div>
          ) : (
            <OrdersTable orders={tableOrders} />
          )}
        </CardContent>
      </Card>
    </section>
  )
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
