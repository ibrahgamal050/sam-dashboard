"use client"
import { create } from 'zustand'

export type KitchenItem = { _id: string; name: string; qty: number; state: 'queued'|'cooking'|'ready'; notes?: string }
export type KitchenTicket = {
  ticketId: string
  orderId: string
  restaurantId: string
  station: string
  status: 'QUEUED'|'COOKING'|'READY'
  createdAt: string
  promisedAt?: string
  items: KitchenItem[]
}

type Connection = 'connecting'|'open'|'closed'

type State = {
  tickets: KitchenTicket[]
  filter: 'all'|'QUEUED'|'COOKING'|'READY'
  connection: Connection
  setFilter: (f: State['filter']) => void
  setConnection: (c: Connection) => void
  fetchInitial: (restaurantId: string, station: string) => Promise<void>
  upsert: (t: Partial<KitchenTicket> & { ticketId: string }) => void
  bump: (ticketId: string) => Promise<void>
  recall: (ticketId: string) => Promise<void>
  setItemState: (itemId: string, state: KitchenItem['state']) => Promise<void>
}

export const useKitchenStore = create<State>((set, get) => ({
  tickets: [],
  filter: 'all',
  connection: 'connecting',
  setFilter: (f) => set({ filter: f }),
  setConnection: (c) => set({ connection: c }),

  async fetchInitial(restaurantId, station) {
    const res = await fetch(`/api/kitchen/tickets?restaurantId=${restaurantId}&station=${station}`)
    if (!res.ok) return
    const data = await res.json()
    set({ tickets: data.tickets || [] })
  },

  upsert(t) {
    const list = get().tickets.slice()
    const idx = list.findIndex((x) => x.ticketId === t.ticketId)
    const merged = idx >= 0 ? { ...list[idx], ...t } : (t as any)
    if (idx >= 0) list[idx] = merged
    else list.unshift(merged as any)
    set({ tickets: list })
  },

  async bump(ticketId) {
    const prev = get().tickets
    set({ tickets: prev.map((t) => t.ticketId === ticketId ? { ...t, status: 'READY' } : t) })
    await fetch(`/api/kitchen/tickets/${ticketId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bump' }) })
  },
  async recall(ticketId) {
    const prev = get().tickets
    set({ tickets: prev.map((t) => t.ticketId === ticketId ? { ...t, status: 'COOKING' } : t) })
    await fetch(`/api/kitchen/tickets/${ticketId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'recall' }) })
  },
  async setItemState(itemId, state) {
    await fetch(`/api/kitchen/items/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) })
  },
}))

