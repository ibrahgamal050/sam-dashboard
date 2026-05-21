"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowRight, Filter, Search, UserCircle2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ApiOrder = {
  orderId: string
  createdAt?: string
  customer?: {
    name?: string
    phone?: string
    email?: string
  } | null
  userId?: string | null
  totalPrice?: number
  deliveryAddress?: string | null
}

type CustomerRow = {
  id: string
  name: string
  email: string
  phone: string
  orders: number
  lastOrder: string
  totalSpent: number
}

const formatDate = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("ru-RU").format(date)
}

const resolveCustomerKey = (order: ApiOrder) => {
  if (order.customer?.phone) return `phone:${order.customer.phone}`
  if (order.customer?.email) return `email:${order.customer.email}`
  if (order.userId) return `user:${order.userId}`
  if (order.deliveryAddress) return `addr:${order.deliveryAddress}`
  return `order:${order.orderId}`
}

const buildCustomerName = (order: ApiOrder) => {
  if (order.customer?.name) return order.customer.name
  if (order.userId) return `Клиент ${order.userId.slice(-4)}`
  return "Неизвестный клиент"
}

export default function CustomersPage() {
  const params = useParams()
  const rawSubdomain = Array.isArray(params?.subdomain) ? params.subdomain[0] : (params?.subdomain as string)
  const rawSlug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const subdomain = rawSubdomain ?? rawSlug ?? ""
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchCustomers = useCallback(async (): Promise<CustomerRow[]> => {
    if (!subdomain) return []

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

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
      if (!ordersRes.ok) throw new Error("Не удалось загрузить заказы ресторана")

      const data = await ordersRes.json()
      return mapOrdersToCustomers(data?.orders || [])
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
    if (!ordersRes.ok) throw new Error("Не удалось загрузить заказы супермаркета")

    const data = await ordersRes.json()
    return mapOrdersToCustomers(data?.orders || [])
  }, [subdomain])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!subdomain) return
      try {
        setLoading(true)
        setError(null)
        const rows = await fetchCustomers()
        if (!cancelled) setCustomers(rows)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setCustomers([])
          setError("Не удалось загрузить клиентов с сервера.")
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
  }, [fetchCustomers, subdomain])

  const stats = useMemo(() => {
    const total = customers.length
    const top = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0]
    return { total, top }
  }, [customers])

  const filteredCustomers = useMemo(() => {
    if (!query.trim()) return customers
    const q = query.toLowerCase()
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.id].some((value) =>
        value.toLowerCase().includes(q),
      ),
    )
  }, [customers, query])

  return (
    <section className="relative space-y-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-10 top-8 h-64 w-64 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-lime-200/50 blur-3xl" />
      </div>

      <div className="relative space-y-6">
        <div className="overflow-hidden rounded-3xl border-none bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 p-5 text-white shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-center sm:justify-between">
            <div className="space-y-2 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">تفاعل العملاء</p>
              <h1 className="text-2xl font-semibold sm:text-3xl">العملاء</h1>
              <p className="max-w-xl text-sm text-emerald-50/90">تابع تواصل الضيوف، تكرار الطلبات، وأفضل العملاء.</p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-50/90">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <UserCircle2 className="h-4 w-4" /> Всего: {stats.total}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <ArrowRight className="h-4 w-4" /> Топ по тратам: {stats.top?.name || "—"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="flex-row-reverse gap-2 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Filter className="h-4 w-4" /> فلترة
              </Button>
              <Button className="flex-row-reverse gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-lg shadow-emerald-500/30 hover:bg-emerald-50">
                <UserPlus className="h-4 w-4" />
                إضافة عميل
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100/80 bg-white/85 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 border-b border-emerald-50/80 px-4 py-4 sm:flex-row-reverse sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
              <Input
                type="search"
                placeholder="Поиск клиента"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 rounded-full border-emerald-200 bg-white/80 pr-9 text-right text-sm"
              />
            </div>
            <Button variant="ghost" className="rounded-full border border-emerald-100 bg-emerald-50/80 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
              تصدير القائمة
            </Button>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-emerald-700">جارٍ تحميل العملاء...</div>
          ) : error ? (
            <div className="px-4 py-10 text-center text-sm text-rose-600">{error}</div>
          ) : null}

          {!loading && !error ? (
            <>
              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-50/60">
                      <TableHead className="w-32 text-right">معرف العميل</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">الطلبات</TableHead>
                      <TableHead className="text-right">آخر طلب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-emerald-700">
                          لا يوجد عملاء مطابقون لبحثك.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-emerald-50/60">
                          <TableCell className="text-right font-semibold text-emerald-900">{customer.id}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-900">{customer.name}</TableCell>
                          <TableCell className="text-right text-emerald-700/90">{customer.email}</TableCell>
                          <TableCell className="text-right text-emerald-700/90">{customer.phone}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-900">{customer.orders}</TableCell>
                          <TableCell className="text-right text-emerald-700/80">
                            {formatDate(customer.lastOrder)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 px-4 py-4 sm:hidden">
                {filteredCustomers.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-6 text-center text-sm text-emerald-800">
                    لا يوجد عملاء مطابقون لبحثك.
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm backdrop-blur"
                    >
                      <div className="flex items-center justify-between text-right">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">{customer.name}</p>
                          <p className="text-xs text-emerald-700/80">{customer.email}</p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                          {customer.orders} заказов
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-emerald-700/80">{customer.phone}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-emerald-700/80">
                        <span>ID: {customer.id}</span>
                        <span>Последний заказ: {formatDate(customer.lastOrder)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function mapOrdersToCustomers(orders: ApiOrder[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>()

  orders.forEach((order) => {
    const key = resolveCustomerKey(order)
    const createdAt = order.createdAt || new Date().toISOString()
    const existing = map.get(key)
    const totalPrice = Number(order.totalPrice ?? 0)

    if (!existing) {
      map.set(key, {
        id: key.replace(/^(phone|email|user|addr|order):/, "CUS-"),
        name: buildCustomerName(order),
        email: order.customer?.email || "",
        phone: order.customer?.phone || "",
        orders: 1,
        lastOrder: createdAt,
        totalSpent: totalPrice,
      })
      return
    }

    existing.orders += 1
    existing.totalSpent += totalPrice
    const prevDate = new Date(existing.lastOrder || 0).getTime()
    const nextDate = new Date(createdAt).getTime()
    if (!Number.isNaN(nextDate) && (Number.isNaN(prevDate) || nextDate > prevDate)) {
      existing.lastOrder = createdAt
    }
    map.set(key, existing)
  })

  return Array.from(map.values()).sort((a, b) => b.orders - a.orders)
}
