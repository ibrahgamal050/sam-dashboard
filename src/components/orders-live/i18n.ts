// src/components/dashboard/orders-live/i18n.ts
"use client"

import type { Locale } from "@/lib/locale"

export type OrdersI18n = {
  fallbackTitle: string
  refresh: string
  autoAccept: string
  muteAutoAccepted: string
  searchPlaceholder: string
  statusPlaceholder: string
  typePlaceholder: string
  sortTooltip: {
    newest: string
    oldest: string
  }
  liveRefresh: string
  failedBadge: string
  noRestaurantTitle: string
  noRestaurantSubtitle: string
  errorTitle: string
  tryAgain: string
  selectOrder: string
  noOrdersMatch: string
  mobileDetailsTitle: string
  language: string

  // order actions
  view: string
  ready: string
  delivered: string
  canceled: string
  updating: string

  // order types
  delivery: string
  pickup: string
  dine_in: string

  // payment
  paid: string
  unpaid: string
}

export const STRINGS: Record<Locale, OrdersI18n> = {
  en: {
    fallbackTitle: "Live Orders",
    refresh: "Refresh",
    autoAccept: "Auto-accept",
    muteAutoAccepted: "Mute auto-accepted",
    searchPlaceholder: "Search order #, customer, phone",
    statusPlaceholder: "Status",
    typePlaceholder: "Type",
    sortTooltip: {
      newest: "Sort by newest",
      oldest: "Sort by oldest",
    },
    liveRefresh: "Live refresh every 5s",
    failedBadge: "failed to load",
    noRestaurantTitle: "No restaurant selected",
    noRestaurantSubtitle: "Please choose a branch to view live orders.",
    errorTitle: "Failed to load orders",
    tryAgain: "Try again",
    selectOrder: "Select an order",
    noOrdersMatch: "No orders match your filters",
    mobileDetailsTitle: "Order Details",
    language: "Language",

    view: "View",
    ready: "Ready",
    delivered: "Delivered",
    canceled: "Canceled",
    updating: "Updating...",

    delivery: "Delivery",
    pickup: "Pickup",
    dine_in: "Dine-in",

    paid: "Paid",
    unpaid: "Unpaid",
  },

  ar: {
    fallbackTitle: "الطلبات الحية",
    refresh: "تحديث",
    autoAccept: "قبول تلقائي",
    muteAutoAccepted: "كتم الطلبات المقبولة تلقائيًا",
    searchPlaceholder: "ابحث برقم الطلب أو اسم العميل أو الهاتف",
    statusPlaceholder: "الحالة",
    typePlaceholder: "النوع",
    sortTooltip: {
      newest: "ترتيب من الأحدث",
      oldest: "ترتيب من الأقدم",
    },
    liveRefresh: "تحديث مباشر كل 5 ثوانٍ",
    failedBadge: "تعذر التحميل",
    noRestaurantTitle: "لم يتم اختيار مطعم",
    noRestaurantSubtitle: "يرجى اختيار فرع لعرض الطلبات اللحظية.",
    errorTitle: "تعذر تحميل الطلبات",
    tryAgain: "إعادة المحاولة",
    selectOrder: "اختر طلبًا",
    noOrdersMatch: "لا توجد طلبات مطابقة",
    mobileDetailsTitle: "تفاصيل الطلب",
    language: "اللغة",

    view: "عرض",
    ready: "جاهز",
    delivered: "تم التوصيل",
    canceled: "ملغي",
    updating: "جارٍ التحديث",

    delivery: "دليفري",
    pickup: "استلام",
    dine_in: "داخل المطعم",

    paid: "مدفوع",
    unpaid: "غير مدفوع",
  },
}
