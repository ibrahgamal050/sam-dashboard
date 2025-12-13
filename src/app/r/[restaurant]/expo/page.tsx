'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useOrdersStore } from './store'
import { useCartStore } from './cart-store'
import { useOrdersStream } from './useOrdersStream'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Search, Wifi, WifiOff, ShoppingCart } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function ExpoPage() {
  const { rid } = useParams() as { rid?: string }
  const restaurantScope = rid // treat /r/[rid] as subdomain scope
  const [role, setRole] = useState<'waiter'|'expo'>('expo')
  const {
    orders,
    query,
    status,
    type,
    setQuery,
    setStatus,
    setType,
    fetchInitial,
    connection,
  } = useOrdersStore()

  useEffect(() => {
    fetchInitial(restaurantScope, role === 'expo')
  }, [fetchInitial, restaurantScope, role])

  useOrdersStream(restaurantScope)

  const view = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (role === 'expo' && o.status !== 'ready') return false
      if (status !== 'all' && o.status !== status) return false
      if (type !== 'all' && o.type !== type) return false
      if (q && !(`${o.orderId} ${o.customer ?? ''} ${o.table ?? ''}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [orders, query, status, type, role])

  return (
    <div className="mx-auto max-w-5xl p-3 sm:p-6">
      {/* Register Service Worker for PWA */}
      <RegisterSW />
      <div className="mb-3 flex items-center gap-2">
        <Select value={role} onValueChange={(v) => setRole(v as any)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="waiter">Waiter</SelectItem>
            <SelectItem value="expo">Expo</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-full">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search table, order, customer" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Dine-in">Dine-in</SelectItem>
            <SelectItem value="Delivery">Delivery</SelectItem>
            <SelectItem value="Pickup">Pickup</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="queued">queued</SelectItem>
            <SelectItem value="in_progress">in_progress</SelectItem>
            <SelectItem value="ready">ready</SelectItem>
            <SelectItem value="served">served</SelectItem>
            <SelectItem value="canceled">canceled</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="gap-1">
          {connection === 'open' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />} {connection}
        </Badge>
      </div>

      {role === 'waiter' ? (
        <WaiterView subdomain={restaurantScope || undefined} />
      ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {view.map((o) => (
          <Card key={o.orderId} className="border-2">
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="font-semibold">{o.orderId}</div>
                <Badge variant="outline">{o.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {(o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : '')} • {o.type || ''} {o.table ? `• Table ${o.table}` : ''}
              </div>
              <ul className="text-sm">
                {(o.items?.slice(0, 3) ?? []).map((it, i) => (
                  <li key={i}>{it.qty}× {it.name}</li>
                ))}
                {(o.items?.length ?? 0) > 3 && (
                  <li className="text-muted-foreground">+{(o.items?.length ?? 0) - 3} more…</li>
                )}
              </ul>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => useOrdersStore.getState().markReady(o.orderId)}>Ready</Button>
                <Button size="sm" onClick={() => useOrdersStore.getState().markServed(o.orderId)}>Served</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {view.length === 0 && (
          <div className="col-span-full py-10 text-center text-muted-foreground">No orders</div>
        )}
      </div>
      )}
    </div>
  )
}

function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}

function WaiterView({ subdomain }: { subdomain?: string }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const cart = useCartStore()
  const getText = (v: any): string => {
    if (v == null) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object') return v._text || v.en || v.ar || Object.values(v).find((x) => typeof x === 'string') || ''
    return String(v)
  }
  useEffect(() => {
    ;(async () => {
      let id = null as string | null
      if (subdomain) {
        const r = await fetch(`/api/restaurants/${subdomain}`)
        if (r.ok) { const data = await r.json(); id = data._id }
      } else {
        id = localStorage.getItem('expo.restaurantId')
      }
      if (!id) return
      setRestaurantId(id)
      const res = await fetch(`/api/menu?restaurantId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    })()
  }, [subdomain])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const p of products) {
      const key = getText(p.category) || 'Menu'
      ;(map[key] ||= []).push(p)
    }
    return map
  }, [products])

  const total = cart.items.reduce((s, i) => s + i.qty * i.price, 0)

  async function submit() {
    if (!restaurantId || cart.items.length === 0) return
    const payload = cart.toPayload(restaurantId)
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('submit failed')
      cart.clear()
      alert('Order submitted')
    } catch (e) {
      // fallback: queue in localStorage for later
      const queued = JSON.parse(localStorage.getItem('orders.offline.queue') || '[]')
      queued.push({ ts: Date.now(), payload })
      localStorage.setItem('orders.offline.queue', JSON.stringify(queued))
      cart.clear()
      alert('Offline: order queued')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_360px]">
      <div>
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="mb-4">
            <div className="mb-2 text-sm font-semibold uppercase text-muted-foreground">{cat}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {list.map((p) => {
                const name = getText(p.name) || 'Item'
                const price = typeof p.price === 'number' ? p.price : (Array.isArray(p.sizes) ? Math.min(...p.sizes.map((s: any) => typeof s.price === 'number' ? s.price : Infinity)) : 0)
                const priceNumber = isFinite(price) ? price : 0
                return (
                  <button
                    key={p._id}
                    onClick={() => cart.add({ _id: p._id, name, price: priceNumber, category: cat })}
                    className="rounded-lg border p-3 text-left hover:bg-accent"
                  >
                    <div className="font-medium">{name}</div>
                    <div className="text-sm text-muted-foreground">{priceNumber.toFixed(2)}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky top-20 h-fit rounded-lg border p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold">Cart</div>
          <Badge variant="outline" className="gap-1"><ShoppingCart className="h-4 w-4" /> {cart.items.length}</Badge>
        </div>
        <div className="mb-2 flex gap-2">
          <Select value={cart.type} onValueChange={(v) => cart.setType(v as any)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dineIn">Dine-in</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Table" value={cart.table || ''} onChange={(e) => cart.setTable(e.target.value)} />
        </div>
        <ul className="space-y-2">
          {cart.items.map((i) => (
            <li key={i.productId} className="flex items-center justify-between">
              <div>{i.qty}× {i.name}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => cart.dec(i.productId)}>-</Button>
                <Button size="sm" onClick={() => cart.inc(i.productId)}>+</Button>
              </div>
            </li>
          ))}
          {cart.items.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">Add items from the menu</div>}
        </ul>
        <div className="mt-4 flex items-center justify-between font-semibold">
          <div>Total</div>
          <div>{total.toFixed(2)}</div>
        </div>
        <Button className="mt-3 w-full" onClick={submit} disabled={!restaurantId || cart.items.length === 0}>Submit Order</Button>
      </div>
    </div>
  )
}
