"use client"
import { useEffect } from 'react'
import { useKitchenStore } from './store'

export function useKitchenStream(restaurantId: string | null, station: string | null) {
  const upsert = useKitchenStore((s) => s.upsert)
  const setConnection = useKitchenStore((s) => s.setConnection)

  useEffect(() => {
    if (!restaurantId || !station) return
    setConnection('connecting')
    const es = new EventSource(`/api/kitchen/stream?restaurantId=${restaurantId}&station=${station}`)
    es.onopen = () => setConnection('open')
    es.onerror = () => setConnection('closed')
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data.event === 'ticket.created') {
          upsert({ ticketId: data.payload.ticketId })
        } else if (data.event === 'ticket.bumped') {
          upsert({ ticketId: data.payload.ticketId, status: data.payload.status })
        } else if (data.event === 'item.updated') {
          // In a real app we would refetch the ticket; here we signal list refresh implicitly
        }
      } catch {}
    }
    return () => es.close()
  }, [restaurantId, station, upsert, setConnection])
}

