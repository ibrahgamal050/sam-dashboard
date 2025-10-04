"use client"

import type { Order } from "@/types/order"
import { OrderCard } from "./order-card"
import { Timer } from "lucide-react"

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
    
    <div className="col-span-full flex flex-col items-center justify-center py-20 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center shadow-lg border border-blue-200 dark:border-blue-700">
          <Timer className="h-10 w-10 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">No active orders</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
           
               All caught up! New orders will appear here automatically when they come in
             
          </p>
        </div>
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
