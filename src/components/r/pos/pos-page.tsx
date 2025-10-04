"use client"
import React, { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  ShoppingCart,
  Trash2,
  Pause,
  DollarSign,
  Plus,
  Minus,
  Users,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Map,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { useParams } from "next/navigation"
import { usePOSCart } from "./pos-store"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

export default function POSPage() {
  const { rid } = useParams() as { rid?: string }
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [activeCat, setActiveCat] = useState<string>("All")
  const cart = usePOSCart()
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [ordersCursor, setOrdersCursor] = useState<string | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [orderQuery, setOrderQuery] = useState("")
  const { toast } = useToast()


  useEffect(() => {
    ;(async () => {
      if (!rid) return
      const r = await fetch(`/api/restaurants/${rid}`)
      if (r.ok) {
        const data = await r.json()
        setRestaurantId(data._id)
        cart.setCurrency(data.currency || "USD")
      }
    })()
  }, [rid])

  useEffect(() => {
    ;(async () => {
      if (!restaurantId) return
      const res = await fetch(`/api/menu?restaurantId=${restaurantId}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    })()
  }, [restaurantId])

  const getText = (v: any): string => {
    if (v == null) return ""
    if (typeof v === "string") return v
    if (typeof v === "object")
      return v._text || v.en || v.ar || Object.values(v).find((x) => typeof x === "string") || ""
    return String(v)
  }

  const categories = useMemo(() => {
    const set = new Set<string>(["All"])
    for (const p of products) set.add(getText(p.category) || "Menu")
    return Array.from(set)
  }, [products])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (activeCat !== "All" && getText(p.category) !== activeCat) return false
      if (q && !`${getText(p.name)} ${getText(p.category)}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, activeCat, query])

  function addToCart(p: any) {
    const name = getText(p.name) || "Item"
    const price =
      typeof p.price === "number"
        ? p.price
        : Array.isArray(p.sizes)
          ? Math.min(...p.sizes.map((s: any) => (typeof s.price === "number" ? s.price : Number.POSITIVE_INFINITY)))
          : 0
    const priceNumber = isFinite(price) ? price : 0
    cart.add({ _id: p._id, name, price: priceNumber, image: p.image, category: getText(p.category) })
  }

  async function submit() {
    if (!restaurantId || cart.items.length === 0) return

    if (cart.type === "delivery") {
      const location = cart.deliveryLocation || {}
      if (location.lat == null || location.lng == null) {
        toast({ title: "Set delivery location", variant: "destructive" })
        return
      }

      let zone = cart.deliveryZone
      if (!zone) {
        try {
          const res = await fetch("/api/delivery-zones/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ restaurantId, lat: location.lat, lng: location.lng }),
          })
          if (!res.ok) throw new Error("Zone check failed")
          const data = await res.json()
          if (!data.inside) {
            toast({ title: "Outside delivery zone", variant: "destructive" })
            return
          }
          const fetched = data.zone
          cart.setDeliveryZone({ id: fetched.id, name: fetched.name, fee: fetched.fee, minOrder: fetched.minOrder })
          zone = fetched
        } catch (error) {
          console.error("Failed to resolve delivery zone", error)
          toast({ title: "Delivery zone lookup failed", variant: "destructive" })
          return
        }
      }

      const snapshot = cart.getSnapshot()
      const appliedZone = snapshot.deliveryZone
      if (appliedZone && snapshot.totals.subtotal < appliedZone.minOrder) {
        toast({
          title: "Below minimum order",
          description: `Minimum ${appliedZone.minOrder.toFixed(2)} required for ${appliedZone.name}`,
          variant: "destructive",
        })
        return
      }
    }

    const payload = cart.toPayload(restaurantId)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("submit failed")
      const { orderId } = await res.json()
      cart.setLastOrderId(orderId)
     toast({
  title: "Order created",
  description: "طلبك اتسجل بنجاح",
  duration: 3000, // 3 ثواني ويختفي
})

    } catch (e) {
      const queued = JSON.parse(localStorage.getItem("orders.offline.queue") || "[]")
      queued.push({ ts: Date.now(), payload })
      localStorage.setItem("orders.offline.queue", JSON.stringify(queued))
      alert("Offline: order queued")
    }
  }

  function hold() {
    const key = `pos.held.${restaurantId}`
    const held = JSON.parse(localStorage.getItem(key) || "[]")
    held.push({ ts: Date.now(), cart: { ...cart.getSnapshot() } })
    localStorage.setItem(key, JSON.stringify(held))
    cart.clear()
  }

  function recall() {
    const key = `pos.held.${restaurantId}`
    const held = JSON.parse(localStorage.getItem(key) || "[]")
    if (!held.length) return
    const last = held.pop()
    localStorage.setItem(key, JSON.stringify(held))
    cart.replace(last.cart)
  }

  async function payCash() {
    if (!cart.lastOrderId) return alert("Create order first")
    try {
      const res = await fetch(`/api/payments/${cart.lastOrderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "cash", amount: cart.totals.total }),
      })
      if (!res.ok) throw new Error("payment failed")
      alert("Paid and receipt queued")
      cart.clearAll()
    } catch {
      const queued = JSON.parse(localStorage.getItem("payments.offline.queue") || "[]")
      queued.push({ ts: Date.now(), orderId: cart.lastOrderId, method: "cash", amount: cart.totals.total })
      localStorage.setItem("payments.offline.queue", JSON.stringify(queued))
      alert("Offline: payment queued")
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Point of Sale</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage orders and process payments</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <SearchAndFilters query={query} setQuery={setQuery} cart={cart} />
            <div className="flex items-center justify-end">
              <Sheet open={ordersOpen} onOpenChange={setOrdersOpen}>
                <SheetTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">عرض جميع الطلبات</Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>الطلبات</SheetTitle>
                  </SheetHeader>
                  <OrdersList
                    restaurantId={restaurantId}
                    orders={orders}
                    setOrders={setOrders}
                    cursor={ordersCursor}
                    setCursor={setOrdersCursor}
                    loading={ordersLoading}
                    setLoading={setOrdersLoading}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    query={orderQuery}
                    setQuery={setOrderQuery}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_380px] lg:grid-cols-[2fr_320px] xl:grid-cols-[2fr_440px]">
          <main role="main" aria-label="Product catalog" className="space-y-6">
            <CategoryTabs categories={categories} activeCat={activeCat} setActiveCat={setActiveCat} />
            <ProductGrid products={list} getText={getText} onAddToCart={addToCart} />
          </main>

          <aside className="md:sticky md:top-8 md:h-fit lg:sticky lg:top-8 lg:h-fit" role="complementary" aria-label="Shopping cart">
            <CartSidebar
              cart={cart}
              restaurantId={restaurantId}
              onSubmit={submit}
              onHold={hold}
              onRecall={recall}
              onPayCash={payCash}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

function SearchAndFilters({
  query,
  setQuery,
  cart,
}: {
  query: string
  setQuery: (value: string) => void
  cart: any
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-lg">
        <Search
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          aria-hidden="true"
        />
        <Input
          placeholder="Search products by name or category..."
          className="pl-12 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-200 dark:border-slate-700">
          <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <Select value={cart.type} onValueChange={(v) => cart.setType(v as any)}>
            <SelectTrigger className="w-36 h-10 border-0 bg-transparent focus:ring-0">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dineIn">🍽️ Dine-in</SelectItem>
              <SelectItem value="pickup">📦 Pickup</SelectItem>
              <SelectItem value="delivery">🚚 Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-200 dark:border-slate-700">
          <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <Input
            placeholder="Table #"
            value={cart.table || ""}
            onChange={(e) => cart.setTable(e.target.value)}
            className="w-20 h-10 border-0 bg-transparent text-center focus:ring-0 font-medium"
            aria-label="Table number"
          />
        </div>
      </div>
    </div>
  )
}

function CategoryTabs({
  categories,
  activeCat,
  setActiveCat,
}: {
  categories: string[]
  activeCat: string
  setActiveCat: (cat: string) => void
}) {
  return (
    <div className="mb-8">
      <Tabs value={activeCat} onValueChange={setActiveCat}>
        <TabsList className="h-14 w-full justify-start overflow-x-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl p-2">
          {categories.map((c) => (
            <TabsTrigger
              key={c}
              value={c}
              className="px-6 py-3 text-sm font-semibold whitespace-nowrap rounded-lg transition-all duration-200 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

function OrdersList({
  restaurantId,
  orders,
  setOrders,
  cursor,
  setCursor,
  loading,
  setLoading,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  query,
  setQuery,
}: any) {
  useEffect(() => {
    if (!restaurantId) return
    // initial load when opening or changing filters
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ restaurantId })
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
        if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
        params.set('limit', '20')
        const res = await fetch(`/api/orders?${params.toString()}`)
        const data = await res.json()
        setOrders(data.orders || [])
        setCursor(data.nextCursor || null)
      } finally {
        setLoading(false)
      }
    })()
  }, [restaurantId, statusFilter, typeFilter])

  async function loadMore() {
    if (!restaurantId || !cursor || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ restaurantId })
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
      params.set('limit', '20')
      params.set('cursor', String(cursor))
      const res = await fetch(`/api/orders?${params.toString()}`)
      const data = await res.json()
      setOrders((prev: any[]) => [...prev, ...(data.orders || [])])
      setCursor(data.nextCursor || null)
    } finally {
      setLoading(false)
    }
  }

  async function changeStatus(id: string, status: string) {
    setOrders((prev: any[]) => prev.map((o) => (o.orderId === id ? { ...o, status } : o)))
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(restaurantId ? { 'x-restaurant-id': restaurantId } : {}) },
        body: JSON.stringify({ status }),
      })
      toast({ title: `تم تحديث حالة الطلب`, description: `Order ${id} → ${status}` })
    } catch (e) {
      toast({ title: 'فشل تحديث الحالة', description: 'حاول مرة أخرى', variant: 'destructive' as any })
    }
  }

  const view = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (orders || []).filter((o: any) => {
      const table = o.table || ''
      const orderId = o.orderId || ''
      const customer = o.customer?.name || ''
      if (q && !(`${orderId} ${table} ${customer}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [orders, query])

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <Input placeholder="بحث بالطلب/الطاولة/العميل" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="queued">queued</SelectItem>
            <SelectItem value="in_progress">in_progress</SelectItem>
            <SelectItem value="ready">ready</SelectItem>
            <SelectItem value="served">served</SelectItem>
            <SelectItem value="canceled">canceled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="القناة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="dineIn">dineIn</SelectItem>
            <SelectItem value="pickup">pickup</SelectItem>
            <SelectItem value="delivery">delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-2 space-y-2">
        {view.map((o: any) => (
          <div key={o.orderId} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">#{String(o.orderId).slice(-6)}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <div className="space-x-2">
                <Badge variant="outline">{o.type}</Badge>
                <Badge variant="outline">Table {o.table || '-'}</Badge>
                <Badge variant="outline">{o.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary">تغيير الحالة</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['pending','queued','in_progress','ready','served','canceled'].map((s) => (
                      <DropdownMenuItem key={s} onClick={() => changeStatus(o.orderId, s)}>{s}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Placeholder for Edit order modal trigger */}
                <Button size="sm" variant="outline" disabled>تعديل</Button>
              </div>
            </div>
          </div>
        ))}
        {cursor && (
          <div className="pt-2">
            <Button onClick={loadMore} disabled={loading} className="w-full">{loading ? 'جار التحميل…' : 'تحميل المزيد'}</Button>
          </div>
        )}
        {!cursor && view.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-10">لا توجد طلبات</div>
        )}
      </div>
    </div>
  )
}

function ProductGrid({
  products,
  getText,
  onAddToCart,
}: {
  products: any[]
  getText: (v: any) => string
  onAddToCart: (product: any) => void
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center shadow-inner">
            <Search className="h-10 w-10 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">No products found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              Try adjusting your search terms or browse a different category to find what you're looking for.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
      role="grid"
      aria-label={`${products.length} products available`}
    >
      {products.map((p) => (
        <ProductCard key={p._id} product={p} getText={getText} onAddToCart={onAddToCart} />
      ))}
    </div>
  )
}

const ProductCard = React.memo(function ProductCard({
  product,
  getText,
  onAddToCart,
}: {
  product: any
  getText: (v: any) => string
  onAddToCart: (product: any) => void
}) {
  const name = getText(product.name) || "Item"
  const category = getText(product.category)
  const price =
    typeof product.price === "number"
      ? product.price
      : Array.isArray(product.sizes)
        ? Math.min(...product.sizes.map((s: any) => (typeof s.price === "number" ? s.price : Number.POSITIVE_INFINITY)))
        : 0
  const priceNumber = isFinite(price) ? price : 0

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 hover:-translate-y-1 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
      role="gridcell"
    >
      <CardContent className="p-0">
        <button
          onClick={() => onAddToCart(product)}
          className="w-full h-full text-left focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:ring-offset-2 rounded-xl"
          aria-label={`Add ${name} to cart for $${priceNumber.toFixed(2)}`}
        >
          <div className="p-5 space-y-4">
            {product.image && (
              <div className="aspect-square bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl overflow-hidden">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                  {name}
                </h3>
                {category && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                    {category}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">${priceNumber.toFixed(2)}</span>
                <div className="w-9 h-9 bg-linear-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-200 shadow-lg group-hover:shadow-xl">
                  <Plus className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  )
})

function CartSidebar({
  cart,
  restaurantId,
  onSubmit,
  onHold,
  onRecall,
  onPayCash,
}: {
  cart: any
  restaurantId?: string | null
  onSubmit: () => void
  onHold: () => void
  onRecall: () => void
  onPayCash: () => void
}) {
  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-6 bg-linear-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="text-slate-900 dark:text-slate-100 font-bold">Shopping Cart</span>
          <Badge
            variant="outline"
            className="gap-2 px-4 py-2 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 font-semibold"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            <span>{cart.items.length} items</span>
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <CartItems cart={cart} />
        {cart.type === "delivery" && (
          <DeliveryDetails cart={cart} restaurantId={restaurantId} />
        )}
        <CartTotals cart={cart} />
        <CartActions cart={cart} onSubmit={onSubmit} onHold={onHold} onRecall={onRecall} onPayCash={onPayCash} />
      </CardContent>
    </Card>
  )
}

function DeliveryDetails({ cart, restaurantId }: { cart: any; restaurantId?: string | null }) {
  const { toast: pushToast } = useToast()
  const [checking, setChecking] = useState(false)

  const latValue = cart.deliveryLocation?.lat ?? null
  const lngValue = cart.deliveryLocation?.lng ?? null

  const handleLatChange = (value: string) => {
    const parsed = value === "" ? null : Number(value)
    cart.setDeliveryLocation(isFiniteNumber(parsed) ? parsed : null, lngValue)
  }

  const handleLngChange = (value: string) => {
    const parsed = value === "" ? null : Number(value)
    cart.setDeliveryLocation(latValue, isFiniteNumber(parsed) ? parsed : null)
  }

  const checkCoverage = async () => {
    if (!restaurantId) {
      pushToast({ title: "Missing restaurant", variant: "destructive" })
      return
    }
    if (latValue == null || lngValue == null) {
      pushToast({ title: "Set location", description: "Please enter latitude and longitude", variant: "destructive" as any })
      return
    }
    setChecking(true)
    try {
      const res = await fetch("/api/delivery-zones/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, lat: latValue, lng: lngValue }),
      })
      if (!res.ok) {
        throw new Error("check failed")
      }
      const data = await res.json()
      if (!data.inside) {
        cart.setDeliveryZone(null)
        pushToast({
          title: "Outside coverage",
          description: "Selected location is outside delivery zones",
          variant: "destructive" as any,
        })
        return
      }
      const zone = data.zone
      cart.setDeliveryZone({ id: zone.id, name: zone.name, fee: zone.fee, minOrder: zone.minOrder })
      pushToast({
        title: `Zone matched: ${zone.name}`,
        description: `Fee ${zone.fee.toFixed(2)} / Minimum ${zone.minOrder.toFixed(2)}`,
      })
    } catch (error) {
      console.error("Failed to check delivery zone", error)
      pushToast({ title: "Zone check failed", variant: "destructive" })
    } finally {
      setChecking(false)
    }
  }

  const zone = cart.deliveryZone
  const needsMinOrder = zone && cart.totals.subtotal < zone.minOrder

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-700/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Delivery Details</h3>
        <Badge variant="outline" className="text-xs">
          {zone ? zone.name : "No zone"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wide">Latitude</label>
          <Input
            type="number"
            step="any"
            value={latValue ?? ""}
            onChange={(e) => handleLatChange(e.target.value)}
            placeholder="24.7136"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wide">Longitude</label>
          <Input
            type="number"
            step="any"
            value={lngValue ?? ""}
            onChange={(e) => handleLngChange(e.target.value)}
            placeholder="46.6753"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={checkCoverage} disabled={checking} className="flex-1">
          {checking ? "Checking…" : "Check Coverage"}
        </Button>
        {zone && (
          <Button type="button" variant="ghost" onClick={() => cart.setDeliveryZone(null)} className="text-sm">
            Clear
          </Button>
        )}
      </div>
      {zone && (
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p>
            Fee: <span className="font-semibold">{zone.fee.toFixed(2)}</span>
          </p>
          <p>
            Min order: <span className="font-semibold">{zone.minOrder.toFixed(2)}</span>
          </p>
          {needsMinOrder && (
            <p className="text-amber-600 dark:text-amber-400 font-medium">Subtotal below minimum</p>
          )}
        </div>
      )}
    </div>
  )
}

function CartItems({ cart }: { cart: any }) {
  if (cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <ShoppingCart className="h-10 w-10 text-slate-400 dark:text-slate-500" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Cart is empty</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Add items from the menu to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-80 overflow-y-auto">
      <h3 className="sr-only">Cart items ({cart.items.length})</h3>
      {cart.items.map((item: any) => (
        <CartItem key={item.productId} item={item} cart={cart} />
      ))}
    </div>
  )
}

const CartItem = React.memo(function CartItem({ item, cart }: { item: any; cart: any }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-linear-to-r from-slate-50 to-white dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">{item.name}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {cart.currency} {item.price.toFixed(2)} each
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => cart.dec(item.productId)}
          className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          aria-label={`Remove one ${item.name}`}
        >
          <Minus className="h-3 w-3" aria-hidden="true" />
        </Button>

        <div className="w-10 text-center font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-600 rounded-lg py-1">
          {item.qty}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => cart.inc(item.productId)}
          className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          aria-label={`Add one more ${item.name}`}
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
})

function CartTotals({ cart }: { cart: any }) {
  const zone = cart.deliveryZone
  const belowMin = zone && cart.totals.subtotal < zone.minOrder

  return (
    <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span className="font-medium">Subtotal</span>
          <span className="font-semibold">
            {cart.currency} {cart.totals.subtotal.toFixed(2)}
          </span>
        </div>

        {cart.totals.serviceCharge > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span className="font-medium">Service Charge</span>
            <span className="font-semibold">
              {cart.currency} {cart.totals.serviceCharge.toFixed(2)}
            </span>
          </div>
        )}

        {cart.totals.tax > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span className="font-medium">Tax</span>
            <span className="font-semibold">
              {cart.currency} {cart.totals.tax.toFixed(2)}
            </span>
          </div>
        )}

        {cart.totals.deliveryFee > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span className="font-medium">Delivery Fee</span>
            <span className="font-semibold">
              {cart.currency} {cart.totals.deliveryFee.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {cart.type === "delivery" && zone && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/30 p-4 text-sm text-emerald-700 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-semibold">
            <Map className="h-4 w-4" aria-hidden="true" />
            <span>{zone.name}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              Fee: <span className="font-semibold">{zone.fee.toFixed(2)}</span>
            </div>
            <div>
              Minimum: <span className="font-semibold">{zone.minOrder.toFixed(2)}</span>
            </div>
          </div>
          {belowMin && (
            <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>Subtotal below delivery minimum</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-slate-100 pt-4 border-t border-slate-200 dark:border-slate-700 bg-linear-to-r from-slate-50 to-white dark:from-slate-700/30 dark:to-slate-600/30 -mx-6 px-6 py-4 rounded-xl">
        <span>Total</span>
        <span className="text-emerald-600 dark:text-emerald-400">
          {cart.currency} {cart.totals.total.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

function CartActions({
  cart,
  onSubmit,
  onHold,
  onRecall,
  onPayCash,
}: {
  cart: any
  onSubmit: () => void
  onHold: () => void
  onRecall: () => void
  onPayCash: () => void
}) {
  const hasItems = cart.items.length > 0
  const belowDeliveryMin =
    cart.type === "delivery" && cart.deliveryZone && cart.totals.subtotal < cart.deliveryZone.minOrder

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={cart.clear}
          disabled={!hasItems}
          className="gap-2 h-12 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 bg-transparent"
          aria-label="Clear cart"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline font-medium">Clear</span>
        </Button>

        <Button
          variant="outline"
          onClick={onHold}
          disabled={!hasItems}
          className="gap-2 h-12 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200 dark:hover:border-amber-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50 bg-transparent"
          aria-label="Hold order"
        >
          <Pause className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline font-medium">Hold</span>
        </Button>

        <Button
          onClick={onSubmit}
          disabled={!hasItems || belowDeliveryMin}
          className="gap-2 h-12 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-600 dark:to-teal-600 dark:hover:from-emerald-700 dark:hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 font-semibold"
          aria-label="Submit order"
        >
          <CheckCircle className="h-4 w-4" aria-hidden="true" />
          <span>Submit</span>
        </Button>
      </div>

      <Button
        onClick={onPayCash}
        disabled={!cart.lastOrderId}
        className="w-full h-14 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 text-white gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        aria-label="Process cash payment"
      >
        <DollarSign className="h-5 w-5" aria-hidden="true" />
        <span className="font-bold text-lg">Pay Cash</span>
      </Button>

      <div className="text-center pt-2">
        <button
          onClick={onRecall}
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 underline focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-lg px-3 py-2 font-medium transition-colors"
          aria-label="Recall last held order"
        >
          <Clock className="h-4 w-4 inline mr-2" aria-hidden="true" />
          Recall last held order
        </button>
      </div>
    </div>
  )
}

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value)
}
