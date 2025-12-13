"use client"
import { create } from 'zustand'

type Product = { _id: string; name: string; price: number; image?: string; category?: string }
type CartItem = { productId: string; name: string; price: number; qty: number; notes?: string; modifiers?: string[] }

type CartState = {
  items: CartItem[]
  type: 'dineIn'|'pickup'|'delivery'
  table?: string
  customer?: { name?: string; phone?: string; address?: string }
  currency: string
  add: (p: Product) => void
  inc: (id: string) => void
  dec: (id: string) => void
  setType: (t: CartState['type']) => void
  setTable: (t?: string) => void
  setCustomer: (c: CartState['customer']) => void
  clear: () => void
  toPayload: (restaurantId: string) => any
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  type: 'dineIn',
  currency: 'USD',
  add: (p) => set((s) => {
    const ix = s.items.findIndex((i) => i.productId === p._id)
    if (ix >= 0) s.items[ix].qty += 1
    else s.items.push({ productId: p._id, name: p.name, price: p.price, qty: 1 })
    return { items: [...s.items] }
  }),
  inc: (id) => set((s) => ({ items: s.items.map((i) => i.productId === id ? { ...i, qty: i.qty + 1 } : i) })),
  dec: (id) => set((s) => ({ items: s.items.flatMap((i) => i.productId === id ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i]) })),
  setType: (t) => set({ type: t }),
  setTable: (t) => set({ table: t }),
  setCustomer: (c) => set({ customer: c }),
  clear: () => set({ items: [] }),
  toPayload: (restaurantId) => {
    const items = get().items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.qty, price: i.price }))
    const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0)
    const deliveryFee = 0
    const total = subtotal + deliveryFee
    return {
      restaurantId,
      type: get().type,
      table: get().table,
      customer: get().customer,
      items,
      subtotal,
      deliveryFee,
      total,
      currency: get().currency,
      payment: { method: 'cod', status: 'unpaid' },
      status: 'pending',
    }
  },
}))
