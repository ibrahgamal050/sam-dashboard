"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ClipboardList, BarChart3, Settings, Users, Clock, Archive } from "lucide-react"

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
}

interface BottomMenuProps {
  readyCount?: number
  fulfilledCount?: number
  className?: string
}

export function BottomMenu({ readyCount = 0, fulfilledCount = 0, className }: BottomMenuProps) {
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      id: "orders",
      label: "Orders",
      icon: ClipboardList,
      href: "./kds",
      badge: readyCount > 0 ? readyCount : undefined,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      href: "/kds/expediter/analytics",
    },
    {
      id: "timing",
      label: "Timing",
      icon: Clock,
      href: "/kds/expediter/timing",
    },
    {
      id: "fulfilled",
      label: "History",
      icon: Archive,
      href: "./history",
      badge: fulfilledCount > 0 ? fulfilledCount : undefined,
    },
    {
      id: "staff",
      label: "Staff",
      icon: Users,
      href: "/kds/expediter/staff",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/kds/expediter/settings",
    },
  ]

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50",
        "md:px-4 md:py-2",
        className,
      )}
      role="navigation"
      aria-label="Kitchen Display System Navigation"
    >
      <div className="flex items-center justify-around max-w-screen-xl mx-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 px-1 py-2 rounded-lg transition-colors",
                "hover:bg-gray-100 active:bg-gray-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "md:px-3 md:py-2",
                isActive && "bg-blue-50 text-blue-600",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-1", "md:h-6 md:w-6", isActive ? "text-blue-600" : "text-gray-600")} />
                {item.badge && item.badge > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full",
                      "min-w-[18px] h-[18px] flex items-center justify-center",
                      "animate-pulse",
                    )}
                    aria-label={`${item.badge} ${item.label.toLowerCase()}`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium truncate max-w-full",
                  "md:text-sm",
                  isActive ? "text-blue-600" : "text-gray-600",
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
