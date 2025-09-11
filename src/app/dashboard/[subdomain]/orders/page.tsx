'use client'
import React, { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  Search,
  ShoppingBag,
  Truck,
  User,
  XCircle,
  ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import { useParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
type OrderStatus = 'pending' | 'queued' | 'in_progress' | 'ready' | 'served' | 'canceled'
type OrderType = 'Delivery' | 'Pickup' | 'Dine-in'
type PaymentMethod = 'Card' | 'Cash' | 'Online payment'
interface OrderItem {
  name: string
  qty: number
  price: number
}
interface Order {
  id: string
  createdAt: string // ISO string
  customer: {
    name: string
    phone: string
    email: string
  }
  type: OrderType
  paymentMethod: PaymentMethod
  status: OrderStatus
  address?: string
  items: OrderItem[]
  deliveryFee: number
}
const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
const demoOrders: Order[] = [
  {
    id: '#162349',
    createdAt: new Date().toISOString(),
    customer: {
      name: 'John Smith',
      phone: '+1 (312) 123-123',
      email: 'john.smith@example.com',
    },
    type: 'Delivery',
    paymentMethod: 'Card',
    status: 'pending',
    address: 'Sky Park Cir Ste B 17891 92614-2400 Irvine',
    items: [
      { name: 'Breakfast Box', qty: 1, price: 20.28 },
      { name: 'Fresh Brewed Coffee', qty: 1, price: 2.74 },
    ],
    deliveryFee: 2,
  },
  {
    id: '#286728',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    customer: {
      name: 'Emma Fitzgerald',
      phone: '+1 (415) 234-9876',
      email: 'emma.f@example.com',
    },
    type: 'Pickup',
    paymentMethod: 'Online payment',
    status: 'served',
    items: [
      { name: 'Caesar Salad', qty: 2, price: 8.99 },
      { name: 'Lemonade', qty: 2, price: 3.5 },
    ],
    deliveryFee: 0,
  },
  {
    id: '#764507',
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    customer: {
      name: 'Todd Curly',
      phone: '+1 (213) 555-1234',
      email: 'todd.curly@example.com',
    },
    type: 'Dine-in',
    paymentMethod: 'Cash',
    status: 'pending',
    items: [
      { name: 'Margherita Pizza', qty: 1, price: 12.2 },
      { name: 'Iced Tea', qty: 1, price: 2.8 },
    ],
    deliveryFee: 0,
  },
]
function statusBadgeVariant(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'queued':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'ready':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'served':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'canceled':
      return 'bg-zinc-100 text-zinc-700 border-zinc-200'
  }
}
function typeIcon(type: OrderType) {
  switch (type) {
    case 'Delivery':
      return <Truck className="h-4 w-4" />
    case 'Pickup':
      return <ShoppingBag className="h-4 w-4" />
    case 'Dine-in':
      return <BadgeCheck className="h-4 w-4" />
  }
}
export default function OrdersDashboard() {
  const { subdomain } = useParams() as { subdomain: string }
  const [orders, setOrders] = useState<Order[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(orders[0]?.id ?? null)
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All')
  const [typeFilter, setTypeFilter] = useState<'All' | OrderType>('All')
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Last 7 Days' | 'Last 30 Days'>('All')
  const [query, setQuery] = useState('')
  const [mobileDetails, setMobileDetails] = useState(false)
  const { toast } = useToast()

  // Fetch restaurantId by subdomain then load orders
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (!subdomain) return
        // Get restaurant by subdomain to retrieve _id
        const rRes = await fetch(`/api/restaurants/${subdomain}`)
        if (!rRes.ok) throw new Error('Failed to resolve restaurant')
        const restaurant = await rRes.json()
        const restaurantId = restaurant?._id
        if (!restaurantId) throw new Error('Restaurant id missing')
        setRestaurantId(restaurantId)
        const oRes = await fetch(`/api/orders?restaurantId=${restaurantId}`)
        if (!oRes.ok) throw new Error('Failed to fetch orders')
        const data = await oRes.json()
        const mapped: Order[] = (data.orders || []).map((o: any) => {
          const items = (o.items || []).map((it: any) => ({
            name: it.name,
            qty: it.quantity,
            price: it.price,
          }))
          const itemsTotal = items.reduce((s: number, it: any) => s + it.qty * it.price, 0)
          const deliveryFee = Math.max((o.totalPrice ?? itemsTotal) - itemsTotal, 0)
          // coerce backend status variants to the normalized enum
          const rawStatus = String(o.status || 'pending').toLowerCase()
          const normalizedStatus: OrderStatus =
            rawStatus === 'new' ? 'pending' :
            (['pending','queued','in_progress','ready','served','canceled'].includes(rawStatus) ? (rawStatus as OrderStatus) : 'pending')
          return {
            id: o.orderId,
            createdAt: o.createdAt,
            customer: { name: 'Guest', phone: '', email: '' },
            type: 'Delivery',
            paymentMethod: 'Card',
            status: normalizedStatus,
            address: undefined,
            items,
            deliveryFee,
          }
        })
        if (!cancelled) {
          setOrders(mapped)
          if (mapped.length) setSelectedId(mapped[0].id)
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          // Fallback to demo data for development
          setOrders(demoOrders)
          setSelectedId(demoOrders[0]?.id ?? null)
          toast({ title: 'Using demo orders', description: 'Could not fetch orders from API' })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [subdomain, toast])
  const filtered = useMemo(() => {
    const now = new Date()
    return orders.filter((o) => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false
      if (typeFilter !== 'All' && o.type !== typeFilter) return false
      if (query && !(`${o.id} ${o.customer.name}`.toLowerCase().includes(query.toLowerCase()))) return false
      const created = new Date(o.createdAt)
      if (dateFilter === 'Today') {
        const isToday = created.toDateString() === now.toDateString()
        if (!isToday) return false
      } else if (dateFilter === 'Last 7 Days') {
        if (created < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return false
      } else if (dateFilter === 'Last 30 Days') {
        if (created < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return false
      }
      return true
    })
  }, [orders, statusFilter, typeFilter, dateFilter, query])
  const selected =
    filtered.find((o) => o.id === selectedId) ||
    orders.find((o) => o.id === selectedId) ||
    filtered[0]
  const subtotal = selected?.items.reduce((s, it) => s + it.qty * it.price, 0) ?? 0
  const total = subtotal + (selected?.deliveryFee ?? 0)
  async function updateStatus(id: string, status: OrderStatus) {
    // optimistic UI
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(restaurantId ? { 'x-restaurant-id': restaurantId } : {}),
        },
        body: JSON.stringify({ status }),
      })
      toast({ title: `Order ${id} → ${status}` })
    } catch (e) {
      // optionally reload list on error
      console.error(e)
      toast({ title: 'Failed to update status', variant: 'destructive' })
    }
  }
  return (
    <ToastProvider>
      <div className="flex h-[calc(100vh-6rem)] gap-4 md:grid md:grid-cols-[380px_1fr]">
        {/* Left: Orders list + filters */}
        <div className="flex flex-col rounded-lg border bg-background">
          {/* Filters */}
          <div className="border-b p-3">
            <div className="mb-3 flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders or customers"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Select onValueChange={(v: any) => setTypeFilter(v)} value={typeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All types</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Pickup">Pickup</SelectItem>
                  <SelectItem value="Dine-in">Dine-in</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(v: any) => setStatusFilter(v)} value={statusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(v: any) => setDateFilter(v)} value={dateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All dates</SelectItem>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="Last 7 Days">Last 7 days</SelectItem>
                  <SelectItem value="Last 30 Days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Orders list */}
          <ScrollArea className="flex-1">
            <div className="space-y-3 p-3">
              {filtered.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setSelectedId(o.id)
                    setMobileDetails(true)
                  }}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition hover:bg-accent',
                    selected?.id === o.id && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          statusBadgeVariant(o.status)
                        )}
                      >
                        {o.status}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm">Change</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(['pending','queued','in_progress','ready','served','canceled'] as OrderStatus[]).map((s) => (
                            <DropdownMenuItem key={s} onClick={(e) => { e.preventDefault(); updateStatus(o.id, s) }}>
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Badge variant="outline" className="gap-1">
                        {typeIcon(o.type)}
                        {o.type}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <CreditCard className="h-4 w-4" />
                        {o.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">{o.id}</div>
                      <div className="text-base font-medium">{o.customer.name}</div>
                      {o.type === 'Delivery' && o.address && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">Deliver to: {o.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm font-semibold">
                      {money(
                        o.items.reduce((s, it) => s + it.qty * it.price, 0) + o.deliveryFee
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  No orders for current filters
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        {/* Right: Details */}
        <div className="relative hidden md:block">
          {selected ? (
            <OrderDetails
              order={selected}
              subtotal={subtotal}
              total={total}
              onAccept={() => updateStatus(selected.id, 'ready')}
              onReject={() => updateStatus(selected.id, 'canceled')}
              onComplete={() => updateStatus(selected.id, 'served')}
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              Select an order
            </div>
          )}
        </div>
        {/* Mobile slide-in details */}
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 top-[5rem] z-40 bg-background p-4 transition-transform md:hidden',
            mobileDetails ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMobileDetails(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm text-muted-foreground">Back to orders</div>
          </div>
          {selected && (
            <OrderDetails
              order={selected}
              subtotal={subtotal}
              total={total}
              onAccept={() => updateStatus(selected.id, 'Paid')}
              onReject={() => updateStatus(selected.id, 'Rejected')}
              onComplete={() => updateStatus(selected.id, 'Completed')}
            />
          )}
        </div>
      </div>
      <ToastViewport />
    </ToastProvider>
  )
}
function OrderDetails({
  order,
  subtotal,
  total,
  onAccept,
  onReject,
  onComplete,
}: {
  order: Order
  subtotal: number
  total: number
  onAccept: () => void
  onReject: () => void
  onComplete: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <Card className="h-fit">
        <CardHeader className="space-y-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            <span className="font-semibold">{order.id}</span>
            <span className="text-muted-foreground">• {order.customer.name}</span>
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                statusBadgeVariant(order.status)
              )}
            >
              {order.status}
            </span>
            <Badge variant="outline" className="gap-1">
              {typeIcon(order.type)} {order.type}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CreditCard className="h-4 w-4" />
              {order.paymentMethod}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-4 w-4" />
              {new Date(order.createdAt).toLocaleString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {/* Items */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">Order</div>
            <ul className="space-y-2">
              {order.items.map((it, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded border bg-muted text-xs">
                      {it.qty}
                    </span>
                    <span>{it.name}</span>
                  </div>
                  <div>{money(it.qty * it.price)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Order subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span>
                <span>{money(order.deliveryFee)}</span>
              </div>
              <div className="mt-2 flex justify-between font-semibold">
                <span>Order total</span>
                <span>{money(total)}</span>
              </div>
            </div>
          </div>
          {/* Customer / Delivery / Payment */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" /> Customer
              </div>
              <div className="text-sm font-medium">{order.customer.name}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {order.customer.phone}
              </div>
              <div className="text-sm text-muted-foreground">{order.customer.email}</div>
            </div>
            {order.type === 'Delivery' && (
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" /> Delivery
                </div>
                <div className="text-sm text-muted-foreground">{order.address}</div>
              </div>
            )}
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4" /> Payment
              </div>
              <div className="text-sm">{order.paymentMethod}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Action bar */}
      <div className="sticky bottom-0 z-10 flex gap-2 rounded-lg border bg-background p-3 shadow-sm">
        <Button variant="secondary" className="gap-2" onClick={onComplete}>
          <CheckCircle2 className="h-4 w-4" /> Complete
        </Button>
        <Button variant="secondary" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button variant="secondary" className="gap-2">
          <MessageSquare className="h-4 w-4" /> Message
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="destructive" className="gap-2" onClick={onReject}>
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button className="gap-2" onClick={onAccept}>
            <BadgeCheck className="h-4 w-4" /> Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
