// src/components/dashboard/orders-live/MobileOrderDetails.tsx
"use client"

import * as React from "react"
import { ChevronLeft } from "lucide-react"

import { OrderDetails } from "@/components/orders-live/orders/order-details"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/locale"

type PendingActions = Record<string, { accept?: boolean; ready?: boolean; deliver?: boolean; cancel?: boolean }>

type Props = {
  open: boolean
  onClose: () => void

  lang: Locale
  direction: "rtl" | "ltr"

  selectedOrder?: any
  selectedStatus: string

  mutate: () => void | Promise<void>

  pendingActions: PendingActions
  onAction: (orderId: string, status: string, kind: "accept" | "ready" | "deliver" | "cancel") => void
  readOnly?: boolean
}

export default function MobileOrderDetails({
  open,
  onClose,
  lang,
  direction,
  selectedOrder,
  selectedStatus,
  mutate,
  pendingActions,
  onAction,
  readOnly = false,
}: Props) {
  if (!open || !selectedOrder) return null

  const accepting = Boolean(pendingActions[selectedOrder.id]?.accept)
  const readying = Boolean(pendingActions[selectedOrder.id]?.ready)
  const delivering = Boolean(pendingActions[selectedOrder.id]?.deliver)
  const canceling = Boolean(pendingActions[selectedOrder.id]?.cancel)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white md:hidden" dir={direction} lang={lang}>
      <div className="flex items-center gap-2 border-b border-gray-200 p-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-sm font-semibold text-[#1b1b1b]">
          Заказ № {selectedOrder.orderId ?? selectedOrder.id}
        </div>
      </div>

      <div className="p-3">
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
    </div>
  )
}
