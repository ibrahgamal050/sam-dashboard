"use client"
import { create } from 'zustand'

type Item = { name: string; qty: number }
type Order = {
  orderId: string
  restaurantId: string
  status: string
  type?: 'Dine-in' | 'Pickup' | 'Delivery'
  table?: string
  createdAt: string
  items: Item[]
  customer?: string
}

type Connection = 'open' | 'closed' | 'connecting'

type State = {
  orders: Order[]
  query: string
  status: 'all' | Order['status']
  type: 'all' | NonNullable<Order['type']>
  connection: Connection
  restaurantId?: string | null
  setQuery: (q: string) => void
  setStatus: (s: State['status']) => void
  setType: (t: State['type']) => void
  fetchInitial: (subdomain?: string, expoOnly?: boolean) => Promise<void>
  addOrUpdate: (order: Partial<Order> & { orderId: string }) => void
  markReady: (orderId: string) => Promise<void>
  markServed: (orderId: string) => Promise<void>
  setConnection: (c: Connection) => void
}

export const useOrdersStore = create<State>((set, get) => ({
  orders: [],
  query: '',
  status: 'all',
  type: 'all',
  connection: 'connecting',
  restaurantId: null,
  setQuery: (q) => set({ query: q }),
  setStatus: (s) => set({ status: s }),
  setType: (t) => set({ type: t }),
  setConnection: (c) => set({ connection: c }),

  async fetchInitial(subdomain, expoOnly = false) {
    // Resolve restaurantId by subdomain
    let restaurantId: string | null = null
    if (subdomain) {
      const r = await fetch(`/api/restaurants/${subdomain}`)
      if (r.ok) {
        const data = await r.json()
        restaurantId = data._id
      }
    }
    // If not embedded, prompt via localStorage
    if (!restaurantId) restaurantId = localStorage.getItem('expo.restaurantId')
    if (!restaurantId) return
    set({ restaurantId })
    const res = await fetch(`/api/orders?restaurantId=${restaurantId}${expoOnly ? '&expo' : ''}`)
    if (!res.ok) return
    const data = await res.json()
    const mapped: Order[] = (data.orders || []).map((o: any) => ({
      orderId: o.orderId,
      restaurantId: o.restaurantId,
      status: o.status,
      type: o.type,
      table: o.table,
      createdAt: o.createdAt,
      items: (o.items || []).map((it: any) => ({ name: it.name, qty: it.quantity })),
    }))
    set({ orders: mapped })
  },

  addOrUpdate(order) {
    const list = get().orders.slice()
    const idx = list.findIndex((o) => o.orderId === order.orderId)
    const merged = idx >= 0 ? { ...list[idx], ...order } : (order as Order)
    if (idx >= 0) list[idx] = merged as Order
    else list.unshift(merged as Order)
    set({ orders: list })
  },

  async markReady(orderId) {
    // optimistic update
    const prev = get().orders
    set({ orders: prev.map((o) => (o.orderId === orderId ? { ...o, status: 'ready' } : o)) })
    try {
      const rid = get().restaurantId
      await fetch(`/api/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(rid ? { 'x-restaurant-id': rid } : {}) }, body: JSON.stringify({ status: 'ready' }) })
    } catch {}
  },

  async markServed(orderId) {
    const prev = get().orders
    set({ orders: prev.map((o) => (o.orderId === orderId ? { ...o, status: 'served' } : o)) })
    try {
      const rid = get().restaurantId
      await fetch(`/api/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(rid ? { 'x-restaurant-id': rid } : {}) }, body: JSON.stringify({ status: 'served' }) })
    } catch {}
  },
}))
