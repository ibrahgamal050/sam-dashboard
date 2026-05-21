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
  orderNumber?: string
  createdAt: string
  customer?: {
    name?: string | { ar?: string; en?: string }
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
  rowKey: string
  displayId: string
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
  { label: "Все", value: "All" },
  { label: "В доставке", value: "On Delivery" },
  { label: "Доставлено", value: "Delivered" },
  { label: "Отменено", value: "Canceled" },
]

const PAGE_SIZE = 10

export default function OrdersPage() {
  const params = useParams()
  const { toast } = useToast()
  const rawSubdomain = Array.isArray(params?.subdomain) ? params.subdomain[0] : (params?.subdomain as string)
  const rawSlug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const subdomain = rawSubdomain ?? rawSlug ?? ""

  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All")
  const [dateRange, setDateRange] = useState("Все время")
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

    const resolveText = (value: unknown) => {
      if (!value) return ""
      if (typeof value === "string") return value
      if (typeof value === "number") return String(value)
      if (typeof value === "object") {
        const localized = value as { ar?: string; en?: string }
        return localized.ar || localized.en || ""
      }
      return ""
    }

    const mapOrders = (data: { orders?: ApiOrder[] }, addressFallback?: unknown): Order[] =>
      (data.orders || []).map((order: ApiOrder) => {
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

        const displayId = order.orderNumber || order.orderId
        const rowKey = order.orderId || displayId || `${order.createdAt}-${itemsTotal}`

        return {
          id: displayId,
          rowKey,
          displayId,
          createdAt: order.createdAt,
          customer: {
            name: resolveText(order.customer?.name) || "Гость",
            phone: order.customer?.phone || "",
            email: order.customer?.email || "",
          },
          status: normalizedStatus,
          address: resolveText(addressFallback) || "—",
          items,
          deliveryFee,
          type: "Delivery" as OrderType,
        }
      })

    const doFetch = async () => {
      const restaurantRes = await fetch(`/api/restaurants/${encodeURIComponent(subdomain)}`, {
        signal: controller.signal,
      })
      if (restaurantRes.ok) {
        const restaurant = await restaurantRes.json()
        const restaurantId = restaurant?._id
        if (!restaurantId) throw new Error("Идентификатор ресторана недоступен")

        const ordersRes = await fetch(`/api/orders?restaurantId=${restaurantId}&limit=200`, {
          signal: controller.signal,
        })
        if (!ordersRes.ok) throw new Error("Не удалось загрузить заказы")
        const data = await ordersRes.json()
        return mapOrders(data)
      }

      if (restaurantRes.status !== 404) {
        throw new Error("Не удалось определить ресторан")
      }

      const marketRes = await fetch(`/api/retail/supermarkets/slug/${encodeURIComponent(subdomain)}`, {
        signal: controller.signal,
      })
      if (!marketRes.ok) throw new Error("Не удалось определить супермаркет")
      const market = await marketRes.json()
      const supermarketId = market?._id
      if (!supermarketId) throw new Error("Идентификатор супермаркета недоступен")

      const ordersRes = await fetch(`/api/orders?supermarketId=${supermarketId}&limit=200`, {
        signal: controller.signal,
      })
      if (!ordersRes.ok) throw new Error("Не удалось загрузить заказы")
      const data = await ordersRes.json()
      return mapOrders(data, market?.address?.ar || market?.address || undefined)
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
        if ((error as any)?.name !== "AbortError") {
          console.error(error)
        }
        if (!cancelled && (error as any)?.name !== "AbortError") {
          setOrders([])
          toast({ title: "Не удалось загрузить заказы", description: "Произошла ошибка при загрузке заказов." })
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
    if (dateRange === "Сегодня") {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    if (dateRange === "Последние 7 дней") return now - 7 * 86400000
    if (dateRange === "Последние 30 дней") return now - 30 * 86400000
    return 0
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
        rowKey: order.rowKey,
        displayId: order.displayId,
        date: new Date(order.createdAt).toLocaleString(),
        customer: order.customer.name || "Гость",
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
        label: "Общая выручка",
        value: formatCurrency(totals.revenue, "EGP"),
        icon: DollarSign,
      },
      {
        label: "Заказы",
        value: `${totals.orders}`,
        icon: RefreshCw,
      },
      {
        label: "Доставлено",
        value: `${totals.delivered}`,
        icon: CalendarRange,
      },
    ]
  }, [orders])

  const downloadCsv = () => {
    const rows = [
      ["№ заказа", "Дата", "Клиент", "Телефон", "Email", "Статус", "Адрес", "Товары", "Стоимость доставки", "Итого"],
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
    <section className="relative space-y-6 text-right">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-10 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-16 h-48 w-48 rounded-full bg-indigo-100/60 blur-3xl" />
      </div>

      <div className="relative space-y-6">
       


        <Card className="border-slate-200/80 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all",
                    statusFilter === filter.value
                      ? "border-sky-200 bg-[#e9f4ff] text-slate-900 shadow"
                      : "border-transparent bg-slate-100 text-slate-600 hover:border-slate-200 hover:bg-white",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {filter.label}
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-slate-600">
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
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по заказам или клиентам"
                className="h-10 rounded-full border-slate-200 bg-white pr-9 text-sm text-right"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12 text-sm text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Загрузка заказов...
              </div>
            ) : pageOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-700">
                <PackageOpen className="h-8 w-8" />
                <p className="text-sm font-semibold">Заказы не найдены по выбранным фильтрам.</p>
                <p className="text-xs text-slate-500">Попробуйте изменить дату или статус заказа.</p>
              </div>
            ) : (
              <>
                <OrdersTable orders={pageOrders} />
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Показано{" "}
                    <span className="font-medium text-slate-800">{(page - 1) * PAGE_SIZE + 1}</span>
                    {" "}–{" "}
                    <span className="font-medium text-slate-800">
                      {Math.min(page * PAGE_SIZE, tableOrders.length)}
                    </span>
                    {" "}из{" "}
                    <span className="font-medium text-slate-800">{tableOrders.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Назад
                    </Button>
                    <span className="text-xs text-slate-500">
                      Страница {page} / {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200"
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      disabled={page === pageCount}
                    >
                      Вперёд
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
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
