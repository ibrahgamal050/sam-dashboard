"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CartItem {
  productId: string
  _id: string
  name: string
  price: number
  qty: number
  image?: string
  category?: string
}

interface CartTotals {
  subtotal: number
  tax: number
  serviceCharge: number
  deliveryFee: number
  total: number
}

interface CartState {
  items: CartItem[]
  currency: string
  type: "dineIn" | "pickup" | "delivery"
  table: string | null
  lastOrderId: string | null
  totals: CartTotals
}

interface CartActions {
  add: (product: { _id: string; name: string; price: number; image?: string; category?: string }) => void
  inc: (productId: string) => void
  dec: (productId: string) => void
  clear: () => void
  clearAll: () => void
  setCurrency: (currency: string) => void
  setType: (type: "dineIn" | "pickup" | "delivery") => void
  setTable: (table: string) => void
  setLastOrderId: (orderId: string) => void
  toPayload: (restaurantId: string) => any
  getSnapshot: () => CartState
  replace: (state: CartState) => void
}

type CartStore = CartState & CartActions

const calculateTotals = (items: CartItem[], type: string): CartTotals => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const tax = subtotal * 0.08 // 8% tax
  const serviceCharge = subtotal * 0.05 // 5% service charge
  const deliveryFee = type === "delivery" ? 5.0 : 0
  const total = subtotal + tax + serviceCharge + deliveryFee

  return {
    subtotal,
    tax,
    serviceCharge,
    deliveryFee,
    total,
  }
}

export const usePOSCart = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      currency: "USD",
      type: "dineIn",
      table: null,
      lastOrderId: null,
      totals: {
        subtotal: 0,
        tax: 0,
        serviceCharge: 0,
        deliveryFee: 0,
        total: 0,
      },

      // Actions
      add: (product) => {
        const state = get()
        const existingItem = state.items.find((item) => item._id === product._id)

        let newItems: CartItem[]
        if (existingItem) {
          newItems = state.items.map((item) => (item._id === product._id ? { ...item, qty: item.qty + 1 } : item))
        } else {
          newItems = [
            ...state.items,
            {
              productId: product._id,
              _id: product._id,
              name: product.name,
              price: product.price,
              qty: 1,
              image: product.image,
              category: product.category,
            },
          ]
        }

        const totals = calculateTotals(newItems, state.type)
        set({ items: newItems, totals })
      },

      inc: (productId) => {
        const state = get()
        const newItems = state.items.map((item) => (item._id === productId ? { ...item, qty: item.qty + 1 } : item))
        const totals = calculateTotals(newItems, state.type)
        set({ items: newItems, totals })
      },

      dec: (productId) => {
        const state = get()
        const newItems = state.items
          .map((item) => (item._id === productId ? { ...item, qty: item.qty - 1 } : item))
          .filter((item) => item.qty > 0)

        const totals = calculateTotals(newItems, state.type)
        set({ items: newItems, totals })
      },

      clear: () => {
        set({
          items: [],
          totals: {
            subtotal: 0,
            tax: 0,
            serviceCharge: 0,
            deliveryFee: 0,
            total: 0,
          },
        })
      },

      clearAll: () => {
        set({
          items: [],
          lastOrderId: null,
          totals: {
            subtotal: 0,
            tax: 0,
            serviceCharge: 0,
            deliveryFee: 0,
            total: 0,
          },
        })
      },

      setCurrency: (currency) => set({ currency }),

      setType: (type) => {
        const state = get()
        const totals = calculateTotals(state.items, type)
        set({ type, totals })
      },

      setTable: (table) => set({ table }),

      setLastOrderId: (orderId) => set({ lastOrderId: orderId }),

      toPayload: (restaurantId) => {
        const state = get()
        const items = state.items.map((item) => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
        }))
        const { subtotal, deliveryFee, total } = state.totals
        return {
          restaurantId,
          items,
          type: state.type,
          table: state.table,
          subtotal,
          deliveryFee,
          total,
          currency: state.currency,
          payment: { method: 'cod', status: 'unpaid' },
          status: 'pending',
        }
      },

      getSnapshot: () => {
        return get()
      },

      replace: (newState) => {
        set({
          items: newState.items,
          currency: newState.currency,
          type: newState.type,
          table: newState.table,
          lastOrderId: newState.lastOrderId,
          totals: calculateTotals(newState.items, newState.type),
        })
      },
    }),
    {
      name: "pos-cart-storage",
      partialize: (state) => ({
        items: state.items,
        currency: state.currency,
        type: state.type,
        table: state.table,
        lastOrderId: state.lastOrderId,
      }),
    },
  ),
)
