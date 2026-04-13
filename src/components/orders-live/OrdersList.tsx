// src/components/dashboard/orders-live/OrdersList.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type NormalizedOrder = {
  id: string
  orderId?: string
  _id?: string
  status?: string
  type?: string
  createdAt?: string
  currency?: string
  totalPrice?: number
  customer?: { name?: string; phone?: string }
  address?: any
  meta?: Record<string, any>
  amounts?: { total?: number; currency?: string }
}

type Props = {
  className?: string
  isLoading?: boolean
  emptyLabel?: string
  loadingLabel?: string

  orders: NormalizedOrder[]
  selectedOrderId: string | null
  onSelectOrder: (id: string) => void

  /**
   * Render function for each row.
   * Recommended: pass <OrderRow ... />
   */
  renderRow: (order: NormalizedOrder, ctx: { isActive: boolean }) => React.ReactNode
}

export default function OrdersList({
  className,
  isLoading,
  emptyLabel = "No orders",
  loadingLabel = "Loading...",
  orders,
  selectedOrderId,
  onSelectOrder,
  renderRow,
}: Props) {
  if (isLoading) {
    return <div className={cn("flex h-40 items-center justify-center text-sm text-gray-500", className)}>{loadingLabel}</div>
  }

  if (!orders?.length) {
    return <div className={cn("flex h-40 items-center justify-center text-sm text-gray-500", className)}>{emptyLabel}</div>
  }

  return (
    <div className={cn("space-y-3", className)}>
      {orders.map((order) => {
        const id = order.id ?? order.orderId ?? order._id ?? ""
        if (!id) return null

        const isActive = selectedOrderId === order.id || selectedOrderId === id

        return (
          <div
            key={id}
            onClick={() => onSelectOrder(order.id ?? id)}
            className={cn("cursor-pointer rounded-2xl transition-all", isActive && "ring-2 ring-[#0EBE7F]")}
          >
            {renderRow(order, { isActive })}
          </div>
        )
      })}
    </div>
  )
}
