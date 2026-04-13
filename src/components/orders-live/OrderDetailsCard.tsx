// src/components/dashboard/orders-live/OrderDetailsCard.tsx
"use client"

import { cn } from "@/lib/utils"
import { formatCurrency } from "./utils/orders-format"

type Props = {
  order: any
  lang: "en" | "ar"
  dir: "rtl" | "ltr"

  onAccept?: () => void
  onReady?: () => void
  onDeliver?: () => void
  onCancel?: () => void

  accepting?: boolean
  readying?: boolean
  delivering?: boolean
  canceling?: boolean
}

export default function OrderDetailsCard({
  order,
  lang,
  dir,
  onAccept,
  onReady,
  onDeliver,
  onCancel,
  accepting,
  readying,
  delivering,
  canceling,
}: Props) {
  if (!order) return null

  const amount = order.amounts?.total ?? order.totalPrice ?? 0
  const currency = order.amounts?.currency ?? order.currency ?? "EGP"

  return (
    <div className="flex flex-col gap-4" dir={dir} lang={lang}>
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-[#1b1b1b]">
            Order #{order.orderId}
          </h2>
          <p className="text-sm text-gray-500 capitalize">
            {order.type} • {order.status}
          </p>
        </div>

        <div className="text-lg font-bold text-[#1b1b1b]">
          {formatCurrency(amount, currency, lang)}
        </div>
      </div>

      {/* Customer */}
      <div className="rounded-xl bg-[#F7F7F7] p-3">
        <div className="text-sm font-semibold text-[#1b1b1b]">
          Customer
        </div>
        <div className="text-sm text-gray-600">
          {order.customer?.name || "Guest"}
        </div>
        <div className="text-xs text-gray-500">
          {order.customer?.phone}
        </div>
        {order.address && (
          <div className="mt-1 text-xs text-gray-500">
            {order.address.street}, {order.address.area}, {order.address.city}
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <div className="mb-2 text-sm font-semibold text-[#1b1b1b]">
          Items
        </div>

        <div className="space-y-2">
          {order.items?.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <div className="text-sm font-semibold">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500">
                  Qty: {item.quantity}
                </div>
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(item.total, currency, lang)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-xl bg-[#F7F7F7] p-3 text-sm">
        <Row label="Subtotal" value={order.amounts?.subtotal} currency={currency} lang={lang} />
        <Row label="Tax" value={order.amounts?.tax} currency={currency} lang={lang} />
        <Row label="Delivery" value={order.amounts?.deliveryFee} currency={currency} lang={lang} />
        <Row label="Service" value={order.amounts?.serviceFee} currency={currency} lang={lang} />
        <div className="mt-2 flex justify-between font-bold">
          <span>Total</span>
          <span>{formatCurrency(amount, currency, lang)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        {onAccept && (
          <ActionButton loading={accepting} onClick={onAccept} color="bg-[#0EBE7F]">
            Accept
          </ActionButton>
        )}

        {onReady && (
          <ActionButton loading={readying} onClick={onReady} color="bg-[#FF6D2E]">
            Ready
          </ActionButton>
        )}

        {onDeliver && (
          <ActionButton loading={delivering} onClick={onDeliver} color="bg-[#6F70FF]">
            Deliver
          </ActionButton>
        )}

        {onCancel && (
          <ActionButton loading={canceling} onClick={onCancel} color="bg-gray-200 text-gray-700">
            Cancel
          </ActionButton>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, currency, lang }: any) {
  if (!value) return null
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span>{formatCurrency(value, currency, lang)}</span>
    </div>
  )
}

function ActionButton({ children, onClick, loading, color }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "h-10 rounded-full px-5 text-sm font-semibold transition",
        color,
        loading && "opacity-70"
      )}
    >
      {loading ? "Updating..." : children}
    </button>
  )
}
