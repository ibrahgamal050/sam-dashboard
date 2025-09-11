import { EventEmitter } from 'events'

const emitter = new EventEmitter()
emitter.setMaxListeners(1000)

export type KitchenEvent = 'ticket.created' | 'item.updated' | 'ticket.bumped'

export function emitKitchenEvent(restaurantId: string, station: string, event: KitchenEvent, payload: any) {
  emitter.emit(`kitchen:${restaurantId}:${station}`, { event, payload, ts: Date.now() })
}

export function subscribeKitchen(restaurantId: string, station: string, cb: (d: any) => void) {
  const channel = `kitchen:${restaurantId}:${station}`
  emitter.on(channel, cb)
  return () => emitter.off(channel, cb)
}

