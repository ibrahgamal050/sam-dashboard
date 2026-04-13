// src/components/dashboard/orders-live/constants.ts
"use client"

/**
 * حالات الطلب اللي نعتبرها منتهية
 * (مش هتدخل في active / auto-accept / notifications)
 */
export const DONE_STATUSES = new Set<string>([
  "ready",
  "served",
  "completed",
  "delivered",
  "canceled",
  "cancelled",
  "rejected",
])

/**
 * ترددات صوت الإشعار حسب نوع الطلب
 * (مختلفة عشان العامل يميّز الطلب من غير ما يبص)
 */
export const ORDER_TYPE_SOUNDS: Record<string, number> = {
  delivery: 480,
  pickup: 560,
  dine_in: 620,
  default: 440,
}

/**
 * أنواع الطلبات المدعومة
 */
export const ORDER_TYPES = ["delivery", "pickup", "dine_in"] as const
export type OrderType = (typeof ORDER_TYPES)[number]

/**
 * حالات الطلب (للاستخدام في UI / filters)
 */
export const ORDER_STATUSES = [
  "pending",
  "queued",
  "accepted",
  "in_progress",
  "preparing",
  "ready",
  "on_the_way",
  "delivered",
  "completed",
  "canceled",
  "rejected",
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/**
 * ألوان بسيطة حسب نوع الطلب (اختياري للـ badges)
 */
export const ORDER_TYPE_STYLES: Record<
  OrderType,
  { bg: string; text: string }
> = {
  delivery: {
    bg: "bg-[#E3F7EE]",
    text: "text-[#1D9F66]",
  },
  pickup: {
    bg: "bg-[#FFF4E5]",
    text: "text-[#FF9800]",
  },
  dine_in: {
    bg: "bg-[#E8ECFF]",
    text: "text-[#6F70FF]",
  },
}
