"use client"

import { useCallback, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getDirection, Locale } from "@/lib/locale"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "outline-solid"

type OrderItem = {
  productId?: string
  name?: string
  quantity?: number
  price?: number
  total?: number
  image?: string
  modifiers?: Array<{ name?: string; price?: number }>
}

type OrderLike = {
  id?: string
  orderId?: string
  _id?: string
  status?: string
  type?: string
  totalPrice?: number
  total?: number
  subtotal?: number
  tax?: number
  serviceFee?: number
  deliveryFee?: number
  discount?: number
  currency?: string
  createdAt?: string
  updatedAt?: string
  notes?: string
  payment?: { method?: string; status?: string }
  paymentMethod?: string
  paymentStatus?: string
  customer?: { name?: string; phone?: string; email?: string }
  address?: any
  meta?: Record<string, any>
  items?: OrderItem[]
  count?: number
  amounts?: {
    subtotal?: number
    tax?: number
    serviceFee?: number
    deliveryFee?: number
    discount?: number
    total?: number
    currency?: string
  }
}

interface OrderDetailsProps {
  order: OrderLike
  onUpdate?: () => void
  onAccept?: () => void
  onReady?: () => void
  onDeliver?: () => void
  onCancel?: () => void
  accepting?: boolean
  readying?: boolean
  delivering?: boolean
  canceling?: boolean
  lang?: Locale
  dir?: "ltr" | "rtl"
}

const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  en: {
    summary: {
      orderLabel: "Заказ",
      statusLabel: "Статус",
      typeLabel: "Тип",
      totalLabel: "Итого",
      itemsCount: (count) => `${count} позиций`,
    },
    actions: {
      refresh: "Обновить",
      accept: "Принять заказ",
      accepting: "Принятие...",
      ready: "Отметить готовым",
      readying: "Обработка...",
      deliver: "Отметить доставленным",
      delivering: "Завершение...",
      cancel: "Отменить заказ",
      canceling: "Отмена...",
    },
    customer: {
      title: "Клиент",
      phone: "Телефон",
      email: "Email",
      notes: "Примечания",
      noNotes: "Нет примечаний",
    },
    address: {
      title: "Адрес доставки",
      noAddress: "Адрес доставки не указан",
      pickup: "Самовывоз",
      instructions: "Инструкции",
    },
    payment: {
      title: "Оплата",
      method: "Способ",
      status: "Статус",
    },
    totals: {
      title: "Разбивка",
      subtotal: "Подытог",
      tax: "Налог",
      service: "Сервисный сбор",
      delivery: "Стоимость доставки",
      discount: "Скидка",
      total: "Итого",
    },
    items: {
      title: "Позиции",
      quantity: "Кол-во",
      price: "Цена",
      total: "Итого",
      empty: "Нет позиций",
    },
    timeline: {
      title: "История",
      created: "Создан",
      accepted: "Принят",
      ready: "Готов",
      delivered: "Доставлен",
      canceled: "Отменён",
      updated: "Последнее обновление",
    },
    meta: {
      title: "Информация о заказе",
      channel: "Канал",
      source: "Источник",
      platform: "Платформа",
      device: "Устройство",
    },
    statuses: {
      pending: "Ожидание",
      queued: "В очереди",
      processing: "Обрабатывается",
      accepted: "Принят",
      in_progress: "В работе",
      preparing: "Готовится",
      ready: "Готов",
      served: "Подан",
      delivered: "Доставлен",
      completed: "Выполнен",
      canceled: "Отменён",
      cancelled: "Отменён",
      rejected: "Отклонён",
      failed: "Ошибка",
    },
    types: {
      delivery: "Доставка",
      pickup: "Самовывоз",
      dine_in: "В зале",
      takeaway: "С собой",
      drive_thru: "Драйв-тру",
    },
    paymentMethods: {
      cash: "Наличные",
      cod: "Наложенный платёж",
      card: "Карта",
      online: "Онлайн",
      wallet: "Кошелёк",
      meelza_pay: "Meelza Pay",
      meelzapay: "Meelza Pay",
      bank: "Банковский перевод",
    },
    paymentStatuses: {
      paid: "Оплачено",
      pending: "Ожидание",
      failed: "Ошибка",
      refunded: "Возврат",
      authorized: "Авторизовано",
    },
    common: {
      unknown: "Неизвестно",
      notAvailable: "Н/Д",
      countLabel: (count) => `${count} позиций`,
    },
  },
  ar: {
    summary: {
      orderLabel: "Заказ",
      statusLabel: "Статус",
      typeLabel: "Тип",
      totalLabel: "Итого",
      itemsCount: (count) => `${count} позиций`,
    },
    actions: {
      refresh: "Обновить",
      accept: "Принять заказ",
      accepting: "Принятие...",
      ready: "Отметить готовым",
      readying: "Обработка...",
      deliver: "Отметить доставленным",
      delivering: "Завершение...",
      cancel: "Отменить заказ",
      canceling: "Отмена...",
    },
    customer: {
      title: "Клиент",
      phone: "Телефон",
      email: "Email",
      notes: "Примечания",
      noNotes: "Нет примечаний",
    },
    address: {
      title: "Адрес доставки",
      noAddress: "Адрес доставки не указан",
      pickup: "Самовывоз",
      instructions: "Инструкции",
    },
    payment: {
      title: "Оплата",
      method: "Способ",
      status: "Статус",
    },
    totals: {
      title: "Разбивка",
      subtotal: "Подытог",
      tax: "Налог",
      service: "Сервисный сбор",
      delivery: "Стоимость доставки",
      discount: "Скидка",
      total: "Итого",
    },
    items: {
      title: "Позиции",
      quantity: "Кол-во",
      price: "Цена",
      total: "Итого",
      empty: "Нет позиций",
    },
    timeline: {
      title: "История",
      created: "Создан",
      accepted: "Принят",
      ready: "Готов",
      delivered: "Доставлен",
      canceled: "Отменён",
      updated: "Последнее обновление",
    },
    meta: {
      title: "Информация о заказе",
      channel: "Канал",
      source: "Источник",
      platform: "Платформа",
      device: "Устройство",
    },
    statuses: {
      pending: "Ожидание",
      queued: "В очереди",
      processing: "Обрабатывается",
      accepted: "Принят",
      in_progress: "В работе",
      preparing: "Готовится",
      ready: "Готов",
      served: "Подан",
      delivered: "Доставлен",
      completed: "Выполнен",
      canceled: "Отменён",
      cancelled: "Отменён",
      rejected: "Отклонён",
      failed: "Ошибка",
    },
    types: {
      delivery: "Доставка",
      pickup: "Самовывоз",
      dine_in: "В зале",
      takeaway: "С собой",
      drive_thru: "Драйв-тру",
    },
    paymentMethods: {
      cash: "Наличные",
      cod: "Наложенный платёж",
      card: "Карта",
      online: "Онлайн",
      wallet: "Кошелёк",
      meelza_pay: "Meelza Pay",
      meelzapay: "Meelza Pay",
      bank: "Банковский перевод",
    },
    paymentStatuses: {
      paid: "Оплачено",
      pending: "Ожидание",
      failed: "Ошибка",
      refunded: "Возврат",
      authorized: "Авторизовано",
    },
    common: {
      unknown: "Неизвестно",
      notAvailable: "Н/Д",
      countLabel: (count) => `${count} позиций`,
    },
  },
  ru: {
    summary: {
      orderLabel: "Заказ",
      statusLabel: "Статус",
      typeLabel: "Тип",
      totalLabel: "Итого",
      itemsCount: (count) => `${count} позиций`,
    },
    actions: {
      refresh: "Обновить",
      accept: "Принять заказ",
      accepting: "Принятие...",
      ready: "Отметить готовым",
      readying: "Обработка...",
      deliver: "Отметить доставленным",
      delivering: "Завершение...",
      cancel: "Отменить заказ",
      canceling: "Отмена...",
    },
    customer: {
      title: "Клиент",
      phone: "Телефон",
      email: "Email",
      notes: "Примечания",
      noNotes: "Нет примечаний",
    },
    address: {
      title: "Адрес доставки",
      noAddress: "Адрес доставки не указан",
      pickup: "Самовывоз",
      instructions: "Инструкции",
    },
    payment: {
      title: "Оплата",
      method: "Способ",
      status: "Статус",
    },
    totals: {
      title: "Разбивка",
      subtotal: "Подытог",
      tax: "Налог",
      service: "Сервисный сбор",
      delivery: "Стоимость доставки",
      discount: "Скидка",
      total: "Итого",
    },
    items: {
      title: "Позиции",
      quantity: "Кол-во",
      price: "Цена",
      total: "Итого",
      empty: "Нет позиций",
    },
    timeline: {
      title: "История",
      created: "Создан",
      accepted: "Принят",
      ready: "Готов",
      delivered: "Доставлен",
      canceled: "Отменён",
      updated: "Последнее обновление",
    },
    meta: {
      title: "Информация о заказе",
      channel: "Канал",
      source: "Источник",
      platform: "Платформа",
      device: "Устройство",
    },
    statuses: {
      pending: "Ожидание",
      queued: "В очереди",
      processing: "Обрабатывается",
      accepted: "Принят",
      in_progress: "В работе",
      preparing: "Готовится",
      ready: "Готов",
      served: "Подан",
      delivered: "Доставлен",
      completed: "Выполнен",
      canceled: "Отменён",
      cancelled: "Отменён",
      rejected: "Отклонён",
      failed: "Ошибка",
    },
    types: {
      delivery: "Доставка",
      pickup: "Самовывоз",
      dine_in: "В зале",
      takeaway: "С собой",
      drive_thru: "Драйв-тру",
    },
    paymentMethods: {
      cash: "Наличные",
      cod: "Наложенный платёж",
      card: "Карта",
      online: "Онлайн",
      wallet: "Кошелёк",
      meelza_pay: "Meelza Pay",
      meelzapay: "Meelza Pay",
      bank: "Банковский перевод",
    },
    paymentStatuses: {
      paid: "Оплачено",
      pending: "Ожидание",
      failed: "Ошибка",
      refunded: "Возврат",
      authorized: "Авторизовано",
    },
    common: {
      unknown: "Неизвестно",
      notAvailable: "Н/Д",
      countLabel: (count) => `${count} позиций`,
    },
  },
}
const normalizeKey = (value?: string) => {
  if (!value) return ""
  return value.toLowerCase().replace(/[\s-]+/g, "_")
}

const toReadable = (value?: string) => {
  if (!value) return ""
  return value
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const pickValue = (source: any, paths: string[]): any => {
  if (!source) return undefined
  for (const path of paths) {
    const segments = path.split(".")
    let current = source
    let failed = false
    for (const segment of segments) {
      if (current == null) {
        failed = true
        break
      }
      current = current[segment]
    }
    if (!failed && current !== undefined && current !== null && current !== "") {
      return current
    }
  }
  return undefined
}

const formatAddress = (address: any): string | undefined => {
  if (!address) return undefined
  if (typeof address === "string") return address
  if (Array.isArray(address)) {
    return address.filter(Boolean).join(", ")
  }
  if (typeof address === "object") {
    const formatted =
      address.formatted ??
      address.description ??
      address.display ??
      [
        address.line1 ?? address.address1,
        address.line2 ?? address.address2,
        address.street,
        address.district,
        address.city ?? address.town,
        address.state ?? address.region,
        address.postalCode ?? address.zip,
        address.country,
      ]
        .filter(Boolean)
        .join(", ")
    return formatted && String(formatted).trim().length ? String(formatted) : undefined
  }
  return undefined
}

const sumItems = (items: OrderItem[] | undefined) => {
  if (!Array.isArray(items) || !items.length) return 0
  return items.reduce((acc, item) => {
    const quantity = Number(item.quantity ?? 0)
    return acc + (Number.isFinite(quantity) ? quantity : 0)
  }, 0)
}

export function OrderDetails({
  order,
  onUpdate,
  onAccept,
  onReady,
  onDeliver,
  onCancel,
  accepting,
  readying,
  delivering,
  canceling,
  lang = "en",
  dir,
}: OrderDetailsProps) {
  const locale: Locale = lang ?? "en"
  const direction = dir ?? getDirection(locale)
  const strings = DETAILS_STRINGS[locale] ?? DETAILS_STRINGS.en

  const statusKey = normalizeKey(order.status ?? "pending")
  const typeKey = normalizeKey(order.type ?? "delivery")

  const statusLabel = strings.statuses[statusKey] ?? toReadable(statusKey || order.status)
  const typeLabel = strings.types[typeKey] ?? toReadable(typeKey || order.type)
  const statusVariant: BadgeVariant = STATUS_BADGE_VARIANTS[statusKey] ?? "secondary"

  const orderId = order.orderId ?? order.id ?? order._id ?? "-"
  const items = Array.isArray(order.items) ? order.items : []
  const itemCount = order.count ?? sumItems(items)

  const currencyCode = (order.currency ?? order.amounts?.currency ?? "USD").toUpperCase()

  const currencyFormatter = useMemo(() => {
    const localeTag = "ru-RU"
    try {
      return new Intl.NumberFormat(localeTag, { style: "currency", currency: currencyCode })
    } catch {
      return new Intl.NumberFormat(localeTag, { style: "currency", currency: "USD" })
    }
  }, [currencyCode, locale])

  const formatCurrencyValue = useCallback(
    (value?: number) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return strings.common.notAvailable
      }
      return currencyFormatter.format(value)
    },
    [currencyFormatter, strings.common.notAvailable],
  )

  const dateFormatter = useMemo(() => {
    const localeTag = "ru-RU"
    return new Intl.DateTimeFormat(localeTag, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }, [locale])

  const formatDateTime = useCallback(
    (value: unknown) => {
      if (!value) return null
      const date = new Date(value as any)
      if (Number.isNaN(date.getTime())) return null
      return dateFormatter.format(date)
    },
    [dateFormatter],
  )

  const paymentMethodKey = normalizeKey(order.payment?.method ?? order.paymentMethod ?? order.meta?.paymentMethod)
  const paymentStatusKey = normalizeKey(order.payment?.status ?? order.paymentStatus ?? order.meta?.paymentStatus)

  const paymentMethodLabel =
    strings.paymentMethods[paymentMethodKey] ??
    strings.paymentMethods[paymentMethodKey.replace(/_/g, "")] ??
    (paymentMethodKey ? toReadable(paymentMethodKey) : strings.common.unknown)

  const paymentStatusLabel =
    strings.paymentStatuses[paymentStatusKey] ??
    (paymentStatusKey ? toReadable(paymentStatusKey) : strings.common.unknown)

  const notes = order.notes ?? order.meta?.notes ?? order.meta?.orderNotes

  const address = order.address ?? order.meta?.address ?? order.meta?.deliveryAddress
  const addressText = formatAddress(address)
  const instructions =
    pickValue(address, ["instructions", "notes"]) ?? pickValue(order.meta, ["deliveryInstructions", "instructions"])

  const totals = {
    subtotal: Number(order.amounts?.subtotal ?? order.subtotal ?? 0),
    tax: Number(order.amounts?.tax ?? order.tax ?? 0),
    service: Number(order.amounts?.serviceFee ?? order.serviceFee ?? 0),
    delivery: Number(order.amounts?.deliveryFee ?? order.deliveryFee ?? 0),
    discount: Number(order.amounts?.discount ?? order.discount ?? 0),
    total: Number(order.amounts?.total ?? order.totalPrice ?? order.total ?? 0),
  }

  const totalsRows = [
    { key: "subtotal", label: strings.totals.subtotal, value: totals.subtotal },
    { key: "tax", label: strings.totals.tax, value: totals.tax },
    { key: "service", label: strings.totals.service, value: totals.service },
    { key: "delivery", label: strings.totals.delivery, value: totals.delivery },
    { key: "discount", label: strings.totals.discount, value: totals.discount ? -Math.abs(totals.discount) : 0 },
    { key: "total", label: strings.totals.total, value: totals.total },
  ]

  const metaEntries = useMemo(() => {
    const meta = order.meta ?? {}
    const entries: Array<{ label: string; value: string }> = []
    const channel = meta.channel ?? meta.orderChannel
    const source = meta.source ?? meta.provider
    const platform = meta.platform ?? meta.platformName
    const device = meta.device ?? meta.deviceType ?? meta.userAgent
    if (channel) entries.push({ label: strings.meta.channel, value: String(channel) })
    if (source) entries.push({ label: strings.meta.source, value: String(source) })
    if (platform) entries.push({ label: strings.meta.platform, value: String(platform) })
    if (device) entries.push({ label: strings.meta.device, value: String(device) })
    return entries
  }, [order.meta, strings.meta.channel, strings.meta.device, strings.meta.platform, strings.meta.source])

  const resolvedStatusHistory = useMemo(() => {
    const history = Array.isArray(order.meta?.statusHistory) ? order.meta?.statusHistory : []
    const normalized = history
      .map((entry: any) => {
        const status = normalizeKey(entry?.status ?? entry?.state ?? entry?.value)
        const at =
          entry?.at ??
          entry?.timestamp ??
          entry?.time ??
          entry?.date ??
          entry?.updatedAt ??
          entry?.createdAt ??
          entry?.occuredAt
        return status && at ? { status, at } : null
      })
      .filter(Boolean) as Array<{ status: string; at: unknown }>

    if (normalized.length) {
      return normalized.map((entry) => ({
        key: entry.status,
        label: strings.statuses[entry.status] ?? toReadable(entry.status),
        value: formatDateTime(entry.at),
      }))
    }

    const meta = order.meta ?? {}
    const accepted = pickValue(meta, [
      "acceptedAt",
      "accepted_at",
      "accepted",
      "inProgressAt",
      "in_progress_at",
      "statusTimestamps.accepted",
      "statusTimestamps.in_progress",
      "timeline.accepted",
      "timeline.in_progress",
    ])
    const ready = pickValue(meta, [
      "readyAt",
      "ready_at",
      "ready",
      "statusTimestamps.ready",
      "timeline.ready",
    ])
    const delivered = pickValue(meta, [
      "deliveredAt",
      "delivered_at",
      "delivered",
      "statusTimestamps.delivered",
      "timeline.delivered",
      "completedAt",
    ])
    const canceled = pickValue(meta, [
      "canceledAt",
      "cancelledAt",
      "canceled_at",
      "cancelled_at",
      "timeline.canceled",
      "timeline.cancelled",
    ])

    const fallback = [
      { key: "created", label: strings.timeline.created, value: formatDateTime(order.createdAt) },
      { key: "accepted", label: strings.timeline.accepted, value: formatDateTime(accepted) },
      { key: "ready", label: strings.timeline.ready, value: formatDateTime(ready) },
      { key: "delivered", label: strings.timeline.delivered, value: formatDateTime(delivered) },
      { key: "canceled", label: strings.timeline.canceled, value: formatDateTime(canceled) },
      { key: "updated", label: strings.timeline.updated, value: formatDateTime(order.updatedAt) },
    ]

    return fallback.filter((entry) => entry.value)
  }, [formatDateTime, order.createdAt, order.meta, order.updatedAt, strings.statuses, strings.timeline])

  const justifyClass = direction === "rtl" ? "justify-end" : "justify-start"
  const textStart = direction === "rtl" ? "text-right" : "text-left"
  const textEnd = direction === "rtl" ? "text-left" : "text-right"

  return (
    <div className="flex h-full flex-1 flex-col bg-background" lang={locale} dir={direction}>
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          <Card className="overflow-hidden border-none bg-background/50 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl">
  <div className="p-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      {/* القسم الأيسر: معلومات الطلب الأساسية */}
      <div className={cn("space-y-1", textStart)}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {strings.summary.orderLabel} <span className="text-primary">#{orderId}</span>
        </p>
        <h3 className="text-3xl font-bold tracking-tight text-foreground">
          {formatCurrencyValue(totals.total)}
        </h3>
        <p className="text-sm font-medium text-muted-foreground/70">
          {strings.summary.itemsCount(itemCount)}
        </p>
      </div>

      {/* القسم الأيمن: التسميات (Badges) بشكل عصري */}
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Badge 
          variant={statusVariant} 
          className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
        >
          {statusLabel}
        </Badge>
        <Badge 
          variant="secondary" 
          className="rounded-full bg-secondary/50 px-3 py-1 text-xs font-medium"
        >
          {typeLabel}
        </Badge>
        <Badge 
          variant="outline" 
          className="rounded-full border-dashed px-3 py-1 text-xs font-medium"
        >
          {strings.payment.status}: {paymentStatusLabel}
        </Badge>
      </div>
    </div>
  </div>

  {/* شريط الإجراءات في الأسفل بخلفية مميزة */}
  <div className="bg-muted/30 px-6 py-4">
    <div className={cn("flex flex-wrap gap-3", justifyClass)}>
      {onUpdate && (
        <Button variant="ghost" size="sm" onClick={onUpdate} className="hover:bg-background">
       
          {strings.actions.refresh}
        </Button>
      )}
      
      <div className="flex flex-wrap gap-2 ml-auto">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={canceling} className="text-destructive hover:bg-destructive/10">
            {canceling ? strings.actions.canceling : strings.actions.cancel}
          </Button>
        )}
        
        {onAccept && (
          <Button variant="default" size="sm" onClick={onAccept} disabled={accepting} className="rounded-full px-6 shadow-md hover:shadow-lg transition-transform active:scale-95">
            {accepting ? strings.actions.accepting : strings.actions.accept}
          </Button>
        )}
        
        {onReady && (
          <Button variant="secondary" size="sm" onClick={onReady} disabled={readying} className="rounded-full px-6 border-primary/20">
            {readying ? strings.actions.readying : strings.actions.ready}
          </Button>
        )}

        {onDeliver && (
          <Button variant="secondary" size="sm" onClick={onDeliver} disabled={delivering} className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90">
            {delivering ? strings.actions.delivering : strings.actions.deliver}
          </Button>
        )}
      </div>
    </div>
  </div>
</Card>


          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{strings.items.title}</h3>
              <span className="text-xs text-muted-foreground">{strings.common.countLabel(itemCount)}</span>
            </div>
            {items.length ? (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const name = item.name ?? strings.common.unknown
                  const quantity = Number(item.quantity ?? 0) || 0
                  const unitPrice = Number(item.price ?? 0)
                  const lineTotal = Number(item.total ?? unitPrice * quantity)
                  return (
                    <div key={`${item.productId ?? item.name ?? index}`} className="space-y-1 rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className={cn("font-medium text-foreground", textStart)}>{name}</span>
                        <span className={cn("text-sm text-foreground", textEnd)}>
                          {formatCurrencyValue(lineTotal)}
                        </span>
                      </div>
                      <div className={cn("flex flex-wrap items-center gap-3 text-xs text-muted-foreground", justifyClass)}>
                        <span>
                          {strings.items.quantity}: {quantity}
                        </span>
                        <span>
                          {strings.items.price}: {formatCurrencyValue(unitPrice)}
                        </span>
                      </div>
                      {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                        <div className={cn("text-xs text-muted-foreground", textStart)}>
                          {item.modifiers
                            .map((modifier) =>
                              modifier?.name
                                ? `${modifier.name}${modifier?.price ? ` (${formatCurrencyValue(Number(modifier.price))})` : ""}`
                                : null,
                            )
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={cn("text-sm text-muted-foreground", textStart)}>{strings.items.empty}</div>
            )}
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-foreground">{strings.timeline.title}</h3>
            {resolvedStatusHistory.length ? (
              <div className="space-y-2">
                {resolvedStatusHistory.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{entry.label}</span>
                    <span className={textEnd}>{entry.value ?? strings.common.notAvailable}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn("text-sm text-muted-foreground", textStart)}>{strings.common.notAvailable}</div>
            )}
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
