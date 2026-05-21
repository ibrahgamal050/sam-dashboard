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

const RU_STRINGS: OrdersI18n = {
  fallbackTitle: "Текущие заказы",
  refresh: "Обновить",
  autoAccept: "Автоприём",
  muteAutoAccepted: "Без звука для автоприёма",
  searchPlaceholder: "Поиск по № заказа, клиенту, телефону",
  statusPlaceholder: "Статус",
  typePlaceholder: "Тип",
  sortTooltip: {
    newest: "Сначала новые",
    oldest: "Сначала старые",
  },
  liveRefresh: "Обновление каждые 5 сек",
  failedBadge: "Ошибка загрузки",
  noRestaurantTitle: "Ресторан не выбран",
  noRestaurantSubtitle: "Выберите филиал для просмотра текущих заказов.",
  errorTitle: "Не удалось загрузить заказы",
  tryAgain: "Повторить",
  selectOrder: "Выберите заказ",
  noOrdersMatch: "Заказы не найдены",
  mobileDetailsTitle: "Детали заказа",
  language: "Язык",

  view: "Просмотр",
  ready: "Готово",
  delivered: "Доставлено",
  canceled: "Отменено",
  updating: "Обновление...",

  delivery: "Доставка",
  pickup: "Самовывоз",
  dine_in: "В зале",

  paid: "Оплачено",
  unpaid: "Не оплачено",
}

export const STRINGS: Record<Locale, OrdersI18n> = {
  en: RU_STRINGS,
  ar: RU_STRINGS,
  ru: RU_STRINGS,
}
