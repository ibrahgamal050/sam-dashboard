import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import mongoose from "mongoose"
import { format } from "date-fns"
import type { ReactNode } from "react"
import {
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
  User,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dbConnect from "@/lib/dbConnect"
import Order from "@/models/Order"
import Restaurant from "@/models/Restaurant"
import SuperMarket from "@/models/SuperMarket"
import RetailOrder from "@/models/RetailOrder"
import { cn } from "@/lib/utils"

function formatCurrency(amount?: number, currency = "EGP") {
  if (typeof amount !== "number") return "—"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

type StatusMeta = { label: string; tone: string; icon: ReactNode; chipClass: string }

const resolveText = (value: unknown) => {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "object") {
    const localized = value as { ar?: string; en?: string }
    return localized.ar || localized.en || ""
  }
  return ""
}

function resolveStatus(status: string | undefined): StatusMeta {
  const normalized = String(status ?? "pending").toLowerCase()
  if (["delivered", "served", "complete", "completed", "ready"].includes(normalized)) {
    return {
      label: "Доставлено",
      tone: "text-emerald-700",
      icon: <CheckCircle2 className="h-4 w-4" />,
      chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    }
  }
  if (["canceled", "cancelled", "rejected"].includes(normalized)) {
    return {
      label: "Отменено",
      tone: "text-rose-700",
      icon: <XCircle className="h-4 w-4" />,
      chipClass: "border-rose-200 bg-rose-50 text-rose-700",
    }
  }
  if (["in_progress", "pending", "queued", "start", "new", "paid"].includes(normalized)) {
    return {
      label: "В обработке",
      tone: "text-sky-700",
      icon: <Truck className="h-4 w-4" />,
      chipClass: "border-sky-200 bg-sky-50 text-sky-700",
    }
  }
  return {
    label: "Ожидание",
    tone: "text-slate-600",
    icon: <Truck className="h-4 w-4" />,
    chipClass: "border-slate-200 bg-slate-50 text-slate-600",
  }
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string; subdomain?: string; slug?: string }>
}) {
  const { id, subdomain: rawSubdomain, slug: rawSlug } = await params
  const subdomain = rawSubdomain ?? rawSlug ?? ""

  await dbConnect()

  type RestaurantLean = { _id: mongoose.Types.ObjectId; name?: { ar?: string; en?: string } }
  type SuperMarketLean = { _id: mongoose.Types.ObjectId; name?: { ar?: string; en?: string } | string }

  const restaurant = await Restaurant.findOne({ subdomain }).lean<RestaurantLean | null>()
  const supermarket = restaurant
    ? null
    : await SuperMarket.findOne({ slug: subdomain }).lean<SuperMarketLean | null>()

  if (!restaurant && !supermarket) notFound()

  type OrderItemLean = {
    _id?: mongoose.Types.ObjectId | string
    productId?: mongoose.Types.ObjectId | string
    name: string
    quantity: number
    price: number
    notes?: string
  }

  type NormalizedOrder = {
    _id: string
    orderId?: string
    orderNumber?: string
    status?: string
    createdAt?: Date
    updatedAt?: Date
    eta?: Date | null
    subtotal?: number
    totalPrice?: number
    deliveryFee?: number
    currency?: string
    type?: string
    paymentMethod?: string | null
    payment?: { method?: string; status?: string }
    paymentStatus?: string | null
    notes?: string
    items: OrderItemLean[]
    customer?: {
      name?: string
      phone?: string
      address?: string
      email?: string
    }
    source: "restaurant" | "retail"
    deliveryAddress?: string
  }

  const normalizeRestaurantOrder = (order: any): NormalizedOrder => {
    const rawCustomer = order.customer ?? {}
    const customer = {
      name: resolveText(rawCustomer.name),
      phone: resolveText(rawCustomer.phone),
      email: resolveText(rawCustomer.email),
      address: resolveText(rawCustomer.address),
    }
    return {
      _id: String(order._id ?? ""),
      orderId: order.orderId,
      orderNumber: order.orderNumber ?? order.meta?.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      eta: order.eta ?? null,
      subtotal: order.subtotal ?? order.totalPrice ?? 0,
      totalPrice: order.totalPrice ?? order.subtotal ?? 0,
      deliveryFee: order.deliveryFee ?? 0,
      currency: order.currency ?? "EGP",
      type: order.type,
      paymentMethod: order.payment?.method ?? order.paymentMethod ?? null,
      paymentStatus: order.payment?.status ?? order.paymentStatus ?? null,
      payment: order.payment ?? undefined,
      notes: order.notes ?? undefined,
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            _id: item._id,
            productId: item.productId,
            name: resolveText(item.name) || "Позиция",
            quantity: Number(item.quantity ?? 0),
            price: Number(item.price ?? 0),
            notes: resolveText(item.notes),
          }))
        : [],
      customer,
      source: "restaurant",
      deliveryAddress: customer.address || undefined,
    }
  }

  const normalizeRetailOrder = (order: any): NormalizedOrder => {
    const items: OrderItemLean[] = Array.isArray(order.items)
      ? order.items.map((item: any) => {
          const qty = Number(item.quantity ?? 0)
          const unitPrice =
            Number.isFinite(item.unitPrice as number)
              ? Number(item.unitPrice)
              : qty
                ? Number(item.subtotal ?? 0) / qty
                : Number(item.price ?? 0)
          return {
            _id: item._id,
            productId: item.productId,
            name: resolveText(item.name) || "Товар",
            quantity: qty,
            price: Number(unitPrice ?? 0),
          }
        })
      : []
    const subtotal =
      Number.isFinite(order.itemsTotal as number) && order.itemsTotal !== undefined
        ? Number(order.itemsTotal)
        : items.reduce((sum: number, item) => sum + item.price * item.quantity, 0)
    const deliveryFee = Number(order.deliveryFee ?? 0)
    const totalPrice =
      Number.isFinite(order.payableTotal as number) && order.payableTotal !== undefined
        ? Number(order.payableTotal)
        : subtotal + deliveryFee
    return {
      _id: String(order._id ?? ""),
      orderId: order.orderId,
      orderNumber: order.orderNumber ?? order.meta?.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      eta: order.eta ?? null,
      subtotal,
      totalPrice,
      deliveryFee,
      currency: order.currency ?? "EGP",
      type: "Delivery",
      paymentMethod: order.paymentMethod ?? null,
      paymentStatus: order.paymentStatus ?? null,
      items,
      customer: {
        name: resolveText(order.customer?.name) || "Клиент",
        phone: resolveText(order.customer?.phone),
        address: resolveText(order.deliveryAddress) || resolveText(order.customer?.address),
        email: resolveText(order.customer?.email),
      },
      notes: resolveText(order.notes),
      source: "retail",
      deliveryAddress: resolveText(order.deliveryAddress) || resolveText(order.customer?.address),
    }
  }

  let order: NormalizedOrder | null = null
  if (restaurant) {
    const matchCriteria: Array<Record<string, unknown>> = [{ orderId: id }, { orderNumber: id }, { "meta.orderNumber": id }]
    if (mongoose.Types.ObjectId.isValid(id)) {
      matchCriteria.unshift({ _id: new mongoose.Types.ObjectId(id) })
    }
    const orderDoc = await Order.findOne({ restaurantId: restaurant._id, $or: matchCriteria }).lean()
    if (!orderDoc) notFound()
    order = normalizeRestaurantOrder(orderDoc)
  } else if (supermarket) {
    const matchCriteria: Array<Record<string, unknown>> = [
      { orderId: id },
      { orderNumber: id },
      { "meta.orderNumber": id },
    ]
    if (mongoose.Types.ObjectId.isValid(id)) {
      matchCriteria.unshift({ _id: new mongoose.Types.ObjectId(id) })
    }
    const orderDoc = await RetailOrder.findOne({ branchId: supermarket._id, $or: matchCriteria }).lean()
    if (!orderDoc) notFound()
    order = normalizeRetailOrder(orderDoc)
  }

  if (!order) notFound()

  const statusInfo = resolveStatus(order.status)
  const createdAt = order.createdAt ? format(order.createdAt, "dd MMM yyyy, hh:mm a") : "—"
  const updatedAt = order.updatedAt ? format(order.updatedAt, "dd MMM yyyy, hh:mm a") : "—"
  const eta = order.eta ? format(order.eta, "dd MMM yyyy, hh:mm a") : null

  const subtotal = order.subtotal ?? order.totalPrice ?? 0
  const deliveryFee = order.deliveryFee ?? 0
  const total = order.totalPrice ?? subtotal + deliveryFee
  const currency = order.currency ?? "EGP"

  const items = Array.isArray(order.items) ? order.items : []
  const customer = order.customer ?? {}
  const customerName = resolveText(customer.name) || "Клиент"
  const customerEmail = resolveText(customer.email)
  const customerPhone = resolveText(customer.phone)
  const orderReference = resolveText(order.orderNumber ?? order.orderId ?? String(order._id))
  const storeName =
    resolveText(restaurant?.name) || resolveText(supermarket?.name) || subdomain
  const storeTypeLabel = order.source === "restaurant" ? "Ресторан" : "Супермаркет"
  const deliveryAddress = resolveText(order.deliveryAddress) || resolveText(customer.address)
  const phoneDigits = customerPhone.replace(/\D/g, "")
  const mapHref = deliveryAddress ? `https://maps.google.com/?q=${encodeURIComponent(deliveryAddress)}` : ""
  const paymentStatusLabel =
    order.paymentStatus === "paid"
      ? "Оплачено"
      : order.paymentStatus === "failed"
      ? "Ошибка оплаты"
      : "Не оплачено"
  const orderTypeLabel =
    order.type === "Pickup" ? "Самовывоз" : order.type === "Dine-in" ? "В зале" : "Доставка"

  const timeline = [
    { label: "Заказ создан", value: createdAt },
    eta ? { label: "Ожидаемое время", value: eta } : null,
    { label: "Последнее обновление", value: updatedAt },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <section className="space-y-6">
      <div className="space-y-6">
        <Card className="border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Link
                  href={`/dashboard/restaurant/${subdomain}/orders`}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад к заказам
                </Link>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="rounded-full bg-slate-100 px-3 py-1">Заказ #{orderReference}</span>
                <Badge variant="outline" className="rounded-full border-slate-200 text-slate-600">
                  {storeTypeLabel}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                    {customerName}
                  </h1>
                  <p className="text-sm text-slate-500">Филиал: {storeName}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                    statusInfo.chipClass,
                  )}
                >
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">
                  {orderTypeLabel}
                </Badge>
                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">
                  {order.paymentMethod === "card"
                    ? "Карта"
                    : order.paymentMethod === "wallet"
                    ? "Кошелёк"
                    : "Наличные"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">Создан {createdAt}</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Truck className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Статус</p>
                  <p className="text-base font-semibold text-slate-800">{statusInfo.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Итого</p>
                  <p className="text-base font-semibold text-slate-800">{formatCurrency(total, currency)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <CalendarRange className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Позиции</p>
                  <p className="text-base font-semibold text-slate-800">{items.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <User className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Телефон</p>
                  <p className="text-base font-semibold text-slate-800">{customerPhone || "—"}</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card className="border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">Позиции</CardTitle>
                <span className="text-sm text-slate-500">{items.length} шт.</span>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => {
                  const lineTotal = item.quantity * item.price
                  return (
                    <div
                      key={String((item as any)._id ?? item.productId ?? item.name)}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                    >
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white">
                        <Image src="/placeholder.svg" alt={item.name} fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        {item.notes ? <p className="text-xs text-slate-500">{item.notes}</p> : null}
                        <p className="text-xs text-slate-500">Кол-во {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{formatCurrency(item.price, currency)}</p>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(lineTotal, currency)}</p>
                      </div>
                    </div>
                  )
                })}

                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-inner">
                  <div className="flex justify-between text-slate-600">
                    <span>Подытог</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Стоимость доставки</span>
                    <span>{formatCurrency(deliveryFee, currency)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-slate-900">
                    <span>Итого</span>
                    <span>{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Временная шкала</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeline.map((entry, index) => (
                  <div key={entry.label} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1 h-2.5 w-2.5 rounded-full",
                        index === 0 ? "bg-slate-700" : "bg-slate-200",
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                      <p className="text-xs text-slate-500">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Клиент</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{customerName || "Гость"}</p>
                    {customerEmail && <p className="text-xs text-slate-500">{customerEmail}</p>}
                  </div>
                </div>
                {customerPhone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4" />
                    <span>{customerPhone}</span>
                  </div>
                )}
                {deliveryAddress && (
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4" />
                    <span>{deliveryAddress}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                    asChild
                  >
                    <Link href={phoneDigits ? `https://wa.me/${phoneDigits}` : "#"}>
                      <MessageCircle className="mr-1 h-4 w-4" />
                      Написать
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                    asChild
                  >
                    <Link href={customerPhone ? `tel:${customerPhone}` : "#"}>
                      <Phone className="mr-1 h-4 w-4" />
                      Позвонить
                    </Link>
                  </Button>
                </div>
                {deliveryAddress && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                    asChild
                  >
                    <Link href={mapHref || "#"}>
                      <MapPin className="mr-1 h-4 w-4" />
                      Открыть на карте
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Оплата</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  <span>
                    Способ оплаты:{" "}
                    {order.paymentMethod === "card"
                      ? "Карта"
                      : order.paymentMethod === "wallet"
                      ? "Кошелёк"
                      : "Наличные"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Badge variant="outline" className="border-slate-200 text-slate-700">
                    {paymentStatusLabel}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card className="border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-900">Примечание клиента</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card className="border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Дополнительная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-slate-500" />
                  <span>Создан: {createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-slate-500" />
                  <span>Обновлён: {updatedAt}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}