"use client"

import type { Order } from "@/types/order"
import { OrderCard } from "./order-card"

interface BoardProps {
  orders: Order[]
  selectedOrderId?: string
  onStatusChange: (orderId: string, status: Order["status"]) => void
  onRecall?: (orderId: string) => void
  onOrderClick?: (orderId: string) => void
  showRecall?: boolean
}

export function Board({
  orders,
  selectedOrderId,
  onStatusChange,
  onRecall,
  onOrderClick,
  showRecall = false,
}: BoardProps) {
  if (orders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-lg">No orders to display</p>
          <p className="text-sm">Orders will appear here when they're ready</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-min">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isSelected={selectedOrderId === order.id}
            onStatusChange={onStatusChange}
            onRecall={onRecall}
            onOrderClick={onOrderClick}
            showRecall={showRecall}
          />
        ))}
      </div>
    </div>
  )
}
