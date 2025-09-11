import { EventEmitter } from 'events'

// Simple in-memory pub/sub for SSE broadcasting
const emitter = new EventEmitter()
emitter.setMaxListeners(1000)

export type OrderEventName = 'order.created' | 'order.updated' | 'item.updated'

export function emitOrderEvent(restaurantId: string, event: OrderEventName, payload: any) {
  emitter.emit(`orders:${restaurantId}`, { event, payload, ts: Date.now() })
}

export function subscribeToRestaurant(restaurantId: string, onEvent: (data: any) => void) {
  const channel = `orders:${restaurantId}`
  emitter.on(channel, onEvent)
  return () => emitter.off(channel, onEvent)
}

