"use client"

import type React from "react"

import type { Order, OrderItem } from "@/types/order"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ElapsedTimer } from "./elapsed-timer"
import { cn } from "@/lib/utils"
import { Clock, Users, Utensils, AlertTriangle } from "lucide-react"

interface OrderCardProps {
  order: Order
  isSelected?: boolean
  onStatusChange: (orderId: string, status: Order["status"]) => void
  onRecall?: (orderId: string) => void
  onOrderClick?: (orderId: string) => void
  showRecall?: boolean
}

const statusStyles = {
  pending: {
    header: "bg-[var(--color-kds-pending)] text-white",
    border: "border-l-[var(--color-kds-pending)]",
  },
  in_progress: {
    header: "bg-[var(--color-kds-in-progress)] text-white",
    border: "border-l-[var(--color-kds-in-progress)]",
  },
  ready: {
    header: "bg-[var(--color-kds-ready)] text-white animate-pulse",
    border: "border-l-[var(--color-kds-ready)] shadow-lg shadow-amber-200",
  },
  served: {
    header: "bg-[var(--color-kds-served)] text-white",
    border: "border-l-[var(--color-kds-served)]",
  },
  canceled: {
    header: "bg-[var(--color-kds-canceled)] text-white",
    border: "border-l-[var(--color-kds-canceled)]",
  },
}

const typeLabels = {
  dine_in: "Dine In",
  takeaway: "Takeaway",
  delivery: "Delivery",
}

const typeIcons = {
  dine_in: Users,
  takeaway: Utensils,
  delivery: Clock,
}

function groupByCourse(items: OrderItem[]) {
  const grouped: Record<string, OrderItem[]> = {}

  items.forEach((item) => {
    if (!grouped[item.course]) {
      grouped[item.course] = []
    }
    grouped[item.course].push(item)
  })

  return grouped
}

function ItemTag({ tag }: { tag: string }) {
  const tagStyles = {
    VEG: "bg-green-100 text-green-800 border-green-200",
    SPICY: "bg-red-100 text-red-800 border-red-200",
    GF: "bg-blue-100 text-blue-800 border-blue-200",
  }

  const icons = {
    VEG: "🌱",
    SPICY: "🌶️",
    GF: "GF",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium",
        tagStyles[tag as keyof typeof tagStyles] || "bg-gray-100 text-gray-800 border-gray-200",
      )}
    >
      {icons[tag as keyof typeof icons] || tag}
    </span>
  )
}

export function OrderCard({
  order,
  isSelected = false,
  onStatusChange,
  onRecall,
  onOrderClick,
  showRecall = false,
}: OrderCardProps) {
  const startTime = new Date(order.createdAt)
  const groupedItems = groupByCourse(order.items)
  const isOverdue = order.etaMinutes && (Date.now() - startTime.getTime()) / (1000 * 60) > order.etaMinutes
  const TypeIcon = typeIcons[order.type]

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return
    }
    onOrderClick?.(order.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onOrderClick?.(order.id)
    }
  }

  return (
    <Card
      className={cn(
        "w-full min-w-[280px] max-w-[320px] overflow-hidden transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary/20",
        "border-l-4",
        statusStyles[order.status].border,
        order.status === "ready" && "ring-2 ring-amber-400/50",
        isOverdue && "ring-2 ring-red-400/50",
        isSelected && "ring-2 ring-primary shadow-xl scale-[1.02] z-10",
        onOrderClick && "hover:scale-[1.01]",
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={onOrderClick ? 0 : -1}
      role={onOrderClick ? "button" : undefined}
      aria-label={onOrderClick ? `Order ${order.number}, click to select` : undefined}
    >
      <div className={cn("px-4 py-3 text-sm font-semibold", statusStyles[order.status].header)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">#{order.number}</span>
              {order.table && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs px-2 py-1">
                  {order.table}
                </Badge>
              )}
            </div>
            {order.priority === "rush" && (
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                RUSH
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="bg-white/20 px-2 py-1 rounded">
              {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
            <ElapsedTimer start={order.createdAt} warnAtMinutes={order.etaMinutes} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 bg-card">
        {/* Order Type Badge */}
        <div className="flex items-center gap-2">
          <TypeIcon className="w-4 h-4 text-muted-foreground" />
          <Badge variant="outline" className="text-xs font-medium border-border">
            {typeLabels[order.type]}
          </Badge>
          {isSelected && (
            <Badge className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20">SELECTED</Badge>
          )}
        </div>

        {/* Items by Course */}
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([course, items]) => (
            <div key={course} className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide border-b border-border pb-1">
                {course}
              </h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-sm leading-tight">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-bold mr-2">
                          {item.qty}
                        </span>
                        {item.name}
                      </span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-xs text-muted-foreground ml-8 italic">{item.modifiers.join(", ")}</div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 ml-8 mt-1 flex-wrap">
                        {item.tags.map((tag) => (
                          <ItemTag key={tag} tag={tag} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm font-medium">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>{order.notes}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-border">
          {!showRecall ? (
            <>
              {order.status === "pending" && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(order.id, "in_progress")
                  }}
                  className="flex-1 bg-[var(--color-kds-in-progress)] hover:bg-[var(--color-kds-in-progress)]/90 font-semibold"
                >
                  Start Cooking
                </Button>
              )}
              {order.status === "in_progress" && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(order.id, "ready")
                  }}
                  className="flex-1 bg-[var(--color-kds-ready)] hover:bg-[var(--color-kds-ready)]/90 font-semibold"
                >
                  Mark Ready
                </Button>
              )}
              {order.status === "ready" && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(order.id, "served")
                  }}
                  className="flex-1 bg-[var(--color-kds-served)] hover:bg-[var(--color-kds-served)]/90 font-semibold"
                >
                  Bump Order
                </Button>
              )}
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onRecall?.(order.id)
              }}
              className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
            >
              Recall Order
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
