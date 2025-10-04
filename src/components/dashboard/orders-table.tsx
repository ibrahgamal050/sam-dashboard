"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useRouter, useParams } from "next/navigation"
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
  const { subdomain } = useParams() as { subdomain: string }

  const allSelected = selectedOrders.length === orders.length && orders.length > 0
  const hasSelection = selectedOrders.length > 0

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map((order) => order.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders((prev) => {
      if (checked) {
        return prev.includes(orderId) ? prev : [...prev, orderId]
      }
      return prev.filter((id) => id !== orderId)
    })
  }

  const statusStyles: Record<OrdersTableRow["status"], { icon: ReactNode; variant: "default" | "secondary" | "destructive" }> = {
    "On Delivery": {
      icon: <Truck className="h-3.5 w-3.5" />,
      variant: "default",
    },
    Delivered: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      variant: "secondary",
    },
    Canceled: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      variant: "destructive",
    },
  }

  const renderActions = (order: OrdersTableRow) => (
    <div className="flex items-center gap-2">
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-blue-600"
        onClick={(event) => event.stopPropagation()}
      >
        View
      </Button>
      {order.status === "On Delivery" && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-slate-500"
          onClick={(event) => event.stopPropagation()}
        >
          Mark delivered
        </Button>
      )}
    </div>
  )

  const selectionBanner = hasSelection ? (
    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
      <span>{selectedOrders.length} orders selected</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="border-blue-200 text-blue-700">
          Dispatch
        </Button>
        <Button variant="ghost" size="sm" className="text-blue-700" onClick={() => setSelectedOrders([])}>
          Clear
        </Button>
      </div>
    </div>
  ) : null

  return (
    <div className="space-y-3">
      {selectionBanner}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] rounded-xl border border-slate-200 bg-white text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                  aria-label="Select all orders"
                />
              </th>
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((order) => {
              const isSelected = selectedOrders.includes(order.id)
              const statusBadge = statusStyles[order.status]

              return (
                <tr
                  key={order.id}
                  className={cn(
                    "cursor-pointer bg-white transition-colors hover:bg-slate-50",
                    isSelected && "bg-blue-50/40",
                  )}
                  onClick={() => router.push(`/dashboard/${subdomain}/orders/${order.id}`)}
                >
                  <td className="px-4 py-3 align-top">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, Boolean(checked))}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Select order ${order.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-900">{order.id}</td>
                  <td className="px-4 py-3 align-top text-xs text-slate-500">{order.date}</td>
                  <td className="px-4 py-3 align-top text-sm text-slate-700">{order.customer}</td>
                  <td className="px-4 py-3 align-top text-sm text-slate-500">{order.location}</td>
                  <td className="px-4 py-3 align-top text-right text-sm font-semibold text-slate-900">
                    {order.amount}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={statusBadge.variant} className="gap-1">
                      {statusBadge.icon}
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top">{renderActions(order)}</td>
                  <td className="px-4 py-3 align-top">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                          }}
                        >
                          Cancel order
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
    </div>
  )
}
