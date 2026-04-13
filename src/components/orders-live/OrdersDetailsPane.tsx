// src/components/dashboard/orders-live/OrdersDetailsPane.tsx
"use client"

import * as React from "react"

import { OrderDetails } from "@/components/orders-live/orders/order-details"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/locale"

type NormalizedOrder = {
  id: string
  orderId?: string
  _id?: string
  status?: string
}

type PendingActions = Record<string, { accept?: boolean; ready?: boolean; deliver?: boolean; cancel?: boolean }>

type Strings = {
  selectOrder: string
  noOrdersMatch: string
}

type Props = {
  className?: string
  lang: Locale
  direction: "rtl" | "ltr"
  strings: Strings

  selectedOrder?: any
  selectedStatus: string

  mutate: () => void | Promise<void>

  pendingActions: PendingActions
  onAction: (orderId: string, status: string, kind: "accept" | "ready" | "deliver" | "cancel") => void
  readOnly?: boolean
}

export default function OrdersDetailsPane({
  className,
  lang,
  direction,
  strings,
  selectedOrder,
  selectedStatus,
  mutate,
  pendingActions,
  onAction,
  readOnly = false,
}: Props) {
  const accepting = selectedOrder ? Boolean(pendingActions[selectedOrder.id]?.accept) : false
  const readying = selectedOrder ? Boolean(pendingActions[selectedOrder.id]?.ready) : false
  const delivering = selectedOrder ? Boolean(pendingActions[selectedOrder.id]?.deliver) : false
  const canceling = selectedOrder ? Boolean(pendingActions[selectedOrder.id]?.cancel) : false

  return (
    <main className={cn("hidden flex-1 md:flex h-full min-h-0", className)} dir={direction} lang={lang}>
      {selectedOrder ? (
        <div className="flex w-full flex-col rounded-[18px] bg-white p-4 shadow-md h-full min-h-0 overflow-hidden">
          <OrderDetails
            order={selectedOrder}
            onUpdate={() => mutate()}
            lang={lang}
            dir={direction}
            onAccept={
              !readOnly && ["pending", "queued"].includes(selectedStatus)
                ? () => onAction(selectedOrder.id, "in_progress", "accept")
                : undefined
            }
            onReady={
              !readOnly && ["pending", "queued", "in_progress"].includes(selectedStatus)
                ? () => onAction(selectedOrder.id, "ready", "ready")
                : undefined
            }
            onDeliver={
              !readOnly && ["ready", "in_progress"].includes(selectedStatus)
                ? () => onAction(selectedOrder.id, "delivered", "deliver")
                : undefined
            }
            onCancel={!readOnly ? () => onAction(selectedOrder.id, "canceled", "cancel") : undefined}
            accepting={accepting}
            readying={readying}
            delivering={delivering}
            canceling={canceling}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-[18px] bg-white text-muted-foreground shadow-md">
          {strings.selectOrder}
        </div>
      )}
    </main>
  )
}
