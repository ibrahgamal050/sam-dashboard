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
import { cn } from "@/lib/utils"

function formatCurrency(amount?: number, currency = "EGP") {
  if (typeof amount !== "number") return "—"
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

type StatusMeta = { label: string; tone: string; icon: ReactNode }

function resolveStatus(status: string | undefined): StatusMeta {
  const normalized = String(status ?? "pending").toLowerCase()
  if (["delivered", "served", "complete", "completed", "ready"].includes(normalized)) {
    return { label: "Delivered", tone: "text-emerald-600", icon: <CheckCircle2 className="h-4 w-4" /> }
  }
  if (["canceled", "cancelled", "rejected"].includes(normalized)) {
    return { label: "Canceled", tone: "text-red-600", icon: <XCircle className="h-4 w-4" /> }
  }
  if (["in_progress", "pending", "queued", "start", "new", "paid"].includes(normalized)) {
    return { label: "In progress", tone: "text-blue-600", icon: <Truck className="h-4 w-4" /> }
  }
  return { label: "Pending", tone: "text-slate-600", icon: <Truck className="h-4 w-4" /> }
}

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string; subdomain: string }
}) {
  const { id, subdomain } = params

  await dbConnect()

  type RestaurantLean = { _id: mongoose.Types.ObjectId }

  const restaurant = await Restaurant.findOne({ subdomain }).lean<RestaurantLean | null>()
  if (!restaurant) notFound()

  const matchCriteria: Array<Record<string, unknown>> = [{ orderId: id }]
  if (mongoose.Types.ObjectId.isValid(id)) {
    matchCriteria.unshift({ _id: new mongoose.Types.ObjectId(id) })
  }

  type OrderItemLean = {
    _id?: mongoose.Types.ObjectId | string
    productId?: mongoose.Types.ObjectId | string
    name: string
    quantity: number
    price: number
    notes?: string
  }

  type OrderLean = {
    _id: mongoose.Types.ObjectId | string
    orderId?: string
    status?: string
    createdAt?: Date
    updatedAt?: Date
    eta?: Date
    subtotal?: number
    totalPrice?: number
    deliveryFee?: number
    currency?: string
    type?: string
    paymentMethod?: string
    payment?: { method?: string; status?: string }
    paymentStatus?: string
    notes?: string
    items?: OrderItemLean[]
    customer?: {
      name?: string
      phone?: string
      address?: string
      email?: string
    }
  }

  const order = await Order.findOne({ restaurantId: restaurant._id, $or: matchCriteria }).lean<OrderLean>()
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
  const orderReference = order.orderId ?? String(order._id)

  const timeline = [
    { label: "Order placed", value: createdAt },
    eta ? { label: "Estimated ready", value: eta } : null,
    { label: "Last update", value: updatedAt },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Link href={`/dashboard/${subdomain}/orders`} className="inline-flex items-center gap-1 text-blue-600">
              <ArrowLeft className="h-4 w-4" />
              Back to orders
            </Link>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Order #{orderReference}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{customer.name || "Guest"}</h1>
            <span className={cn("inline-flex items-center gap-1 text-sm font-medium", statusInfo.tone)}>
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">Created {createdAt}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {order.type ?? "Delivery"}
          </Badge>
          <Badge variant="outline" className="rounded-full border-slate-300 text-slate-600">
            {order.paymentMethod ?? order.payment?.method ?? "cash"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Items</CardTitle>
              <span className="text-sm text-slate-500">{items.length} total</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const lineTotal = item.quantity * item.price
                return (
                  <div
                    key={String((item as any)._id ?? item.productId ?? item.name)}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-slate-100">
                      <Image src="/placeholder.svg" alt={item.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      {item.notes ? <p className="text-xs text-slate-500">{item.notes}</p> : null}
                      <p className="text-xs text-slate-400">Qty {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">{formatCurrency(item.price, currency)}</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(lineTotal, currency)}</p>
                    </div>
                  </div>
                )
              })}

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery fee</span>
                  <span>{formatCurrency(deliveryFee, currency)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeline.map((entry, index) => (
                <div key={entry.label} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      index === 0 ? "bg-blue-500" : "bg-slate-300",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{entry.label}</p>
                    <p className="text-xs text-slate-500">{entry.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{customer.name || "Guest"}</p>
                  {customer.email && <p className="text-xs text-slate-500">{customer.email}</p>}
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4" />
                  <span>{customer.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-full border-slate-300 text-slate-600">
                  Message
                </Button>
                <Button variant="outline" size="sm" className="flex-1 rounded-full border-slate-300 text-slate-600">
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <CreditCard className="h-4 w-4" />
                <span>Method: {order.paymentMethod ?? order.payment?.method ?? "cash"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Badge variant="outline" className="border-slate-300 text-slate-600">
                  {order.paymentStatus ?? order.payment?.status ?? "unpaid"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Customer note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                <span>Created: {createdAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                <span>Updated: {updatedAt}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
