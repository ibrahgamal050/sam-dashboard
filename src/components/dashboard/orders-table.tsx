"use client"

import { useState, type ReactNode } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { Truck, CheckCircle2, XCircle, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Order = {
  id: string
  rowKey: string
  displayId: string
  date: string
  customer: string
  location: string
  amount: string
  status: "On Delivery" | "Delivered" | "Canceled"
}

type OrdersTableRow = Order

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const router = useRouter()
  const params = useParams() as { subdomain?: string; slug?: string }
  const pathname = usePathname()
  const tenant = params.subdomain ?? params.slug ?? ""
  const orderBasePath = pathname?.includes("/dashboard/restaurant/")
    ? `/dashboard/restaurant/${tenant}/orders`
    : pathname?.includes("/dashboard/supermarket/")
    ? `/dashboard/supermarket/${tenant}/orders`
    : `/dashboard/${tenant}/orders`

  const allSelected = selectedOrders.length === orders.length && orders.length > 0
  const hasSelection = selectedOrders.length > 0

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map((order) => order.rowKey))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (orderKey: string, checked: boolean) => {
    setSelectedOrders((prev) => {
      if (checked) {
        return prev.includes(orderKey) ? prev : [...prev, orderKey]
      }
      return prev.filter((id) => id !== orderKey)
    })
  }

  const statusStyles: Record<
    OrdersTableRow["status"],
    { icon: ReactNode; className: string; labelClass?: string }
  > = {
    "On Delivery": {
      icon: <Truck className="h-3.5 w-3.5" />,
      className: "border-sky-200 bg-sky-50 text-sky-700",
    },
    Delivered: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      labelClass: "text-emerald-700",
    },
    Canceled: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      className: "border-rose-200 bg-rose-50 text-rose-700",
    },
  }

  const statusLabels: Record<OrdersTableRow["status"], string> = {
    "On Delivery": "В доставке",
    Delivered: "Доставлено",
    Canceled: "Отменено",
  }

  const selectionBanner = hasSelection ? (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
      <span>Выбрано {selectedOrders.length} заказов</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">
          Отправить
        </Button>
        <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-50" onClick={() => setSelectedOrders([])}>
          Снять выделение
        </Button>
      </div>
    </div>
  ) : null

  return (
    <div className="space-y-3">
      {selectionBanner}
      <div className="hidden overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:block">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                  aria-label="Выбрать все заказы"
                />
              </th>
              <th className="px-4 py-3 font-semibold">№ заказа</th>
              <th className="px-4 py-3 font-semibold">Дата</th>
              <th className="px-4 py-3 font-semibold">Клиент</th>
              <th className="px-4 py-3 font-semibold">Адрес</th>
              <th className="px-4 py-3 font-semibold">Итого</th>
              <th className="px-4 py-3 font-semibold">Статус</th>
              <th className="px-4 py-3 font-semibold">Действия</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const isSelected = selectedOrders.includes(order.rowKey)
              const statusBadge = statusStyles[order.status]

              return (
                <tr
                  key={order.rowKey}
                  className={cn(
                    "cursor-pointer bg-white transition-colors hover:bg-[#f4f8ff]",
                    isSelected && "bg-[#eef5ff] ring-1 ring-[#cfe4ff]",
                  )}
                  onClick={() => router.push(`${orderBasePath}/${order.id}`)}
                >
                  <td className="px-4 py-3 align-top">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOrder(order.rowKey, Boolean(checked))}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Выбрать заказ ${order.displayId}`}
                    />
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-900">{order.displayId}</td>
                  <td className="px-4 py-3 align-top text-xs text-slate-500">{order.date}</td>
                  <td className="px-4 py-3 align-top text-sm font-semibold text-slate-900">{order.customer}</td>
                  <td className="px-4 py-3 align-top text-sm text-slate-500">{order.location}</td>
                  <td className="px-4 py-3 align-top text-sm font-semibold text-slate-900">
                    {order.amount}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge
                      variant="outline"
                      className={cn("gap-2 border px-3 py-1 text-xs font-semibold", statusBadge.className)}
                    >
                      <span className="flex h-2 w-2 items-center justify-center rounded-full bg-current text-transparent">
                        •
                      </span>
                      <span className={cn("flex items-center gap-1", statusBadge.labelClass)}>
                        {statusBadge.icon}
                        {statusLabels[order.status]}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-0 text-slate-600 hover:bg-transparent hover:text-slate-900"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Просмотр
                      </Button>
                      {order.status === "On Delivery" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 text-sky-600 hover:bg-transparent hover:text-slate-900"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Доставлено
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Открыть меню</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                          }}
                        >
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                          }}
                        >
                          Отменить заказ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {orders.map((order) => {
          const statusBadge = statusStyles[order.status]
          const isSelected = selectedOrders.includes(order.rowKey)
          return (
            <button
              key={order.rowKey}
              type="button"
              onClick={() => router.push(`${orderBasePath}/${order.id}`)}
              className={cn(
                "w-full rounded-3xl border border-slate-200 bg-white p-4 text-right shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(15,23,42,0.08)]",
                isSelected && "border-[#cfe4ff] ring-2 ring-[#d9e9ff]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Заказ</p>
                  <p className="text-base font-semibold text-slate-900">#{order.displayId}</p>
                  <p className="text-sm font-semibold text-slate-900">{order.customer}</p>
                  <p className="text-xs text-slate-500">{order.location}</p>
                </div>
                <div className="text-left space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{order.amount}</p>
                  <p className="text-[11px] text-slate-500">{order.date}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span>Статус</span>
                <Badge
                  variant="outline"
                  className={cn("inline-flex gap-2 border px-3 py-1 text-xs font-semibold", statusBadge.className)}
                >
                  <span className="flex h-2 w-2 items-center justify-center rounded-full bg-current text-transparent">•</span>
                  <span className={cn("flex items-center gap-1", statusBadge.labelClass)}>
                    {statusBadge.icon}
                    {statusLabels[order.status]}
                  </span>
                </Badge>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
