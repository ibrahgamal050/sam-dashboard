"use client"
import { useEffect } from 'react'
import { useOrdersStore } from './store'

export function useOrdersStream(subdomain?: string) {
  const addOrUpdate = useOrdersStore((s) => s.addOrUpdate)
  const setConnection = useOrdersStore((s) => s.setConnection)

  useEffect(() => {
    let restaurantId: string | null = null
    let es: EventSource | null = null
    let cancelled = false
    async function run() {
      setConnection('connecting')
      try {
        if (subdomain) {
          const r = await fetch(`/api/restaurants/${subdomain}`)
          if (r.ok) {
            const data = await r.json()
            restaurantId = data._id
          }
        } else {
          restaurantId = localStorage.getItem('expo.restaurantId')
        }
        if (!restaurantId || cancelled) return
        es = new EventSource(`/api/orders/stream?restaurantId=${restaurantId}`)
        es.onopen = () => setConnection('open')
        es.onerror = () => setConnection('closed')
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            if (data.event === 'order.updated') {
              // If it just became ready, refetch expo list to include full details
              if (data.payload?.status === 'ready') {
                fetch(`/api/orders?expo&restaurantId=${restaurantId}`).then(r=>r.json()).then((json)=>{
                  const orders = (json.orders||[])
                  for (const o of orders) addOrUpdate({ orderId: o.orderId, status: o.status, table: o.table, createdAt: o.createdAt, items: (o.items||[]).map((it:any)=>({ name: it.name, qty: it.quantity })) })
                }).catch(()=>{})
              } else {
                addOrUpdate({ orderId: data.payload.orderId })
              }
            }
          } catch {}
        }
      } catch {
        setConnection('closed')
      }
    }
    run()
    return () => {
      cancelled = true
      es?.close()
    }
  }, [subdomain, addOrUpdate, setConnection])
}
