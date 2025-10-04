"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import {
  AppWindowIcon as Apps,
  BarChart3,
  CalendarRange,
  ChevronDown,
  ClipboardList,
  Home,
  Layers,
  LifeBuoy,
  Map,
  Megaphone,
  Menu,
  PackageCheck,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type SidebarProps = {
  subdomain?: string
  isOpen?: boolean
  onClose?: () => void
}

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

type NavGroup = {
  label: string
  items: NavItem[]
  collapsible?: boolean
}

const NAV_SECTIONS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Home", href: "", icon: Home },
      { label: "Orders", href: "orders", icon: ClipboardList },
      { label: "Customers", href: "customers", icon: Users },
      { label: "Analytics", href: "analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    collapsible: true,
    items: [
      { label: "Menu", href: "menu", icon: ShoppingBag },
      { label: "Pages", href: "pages", icon: Layers },
      { label: "Calendar", href: "calendar", icon: CalendarRange },
    ],
  },
  {
    label: "Operations",
    collapsible: true,
    items: [
      { label: "Orderfast Links", href: "orderfast", icon: PackageCheck },
      { label: "Team", href: "team", icon: Users },
      { label: "Apps", href: "apps", icon: Apps },
      { label: "Marketing", href: "marketing", icon: Megaphone },
      { label: "Delivery Zones", href: "delivery-zones", icon: Map },
      { label: "Setup", href: "settings", icon: Settings },
    ],
  },
]

export function Sidebar({ subdomain: subdomainProp, isOpen = false, onClose }: SidebarProps) {
  const params = useParams()
  const fallbackSubdomain = Array.isArray(params?.subdomain)
    ? params.subdomain[0]
    : (params?.subdomain as string) ?? ""
  const subdomain = subdomainProp ?? fallbackSubdomain

  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const basePath = useMemo(() => `/dashboard/${subdomain}`.replace(/\/+$/, ""), [subdomain])

  const isActive = (href: string) => {
    const fullHref = href ? `${basePath}/${href}` : basePath
    if (fullHref === basePath) {
      return pathname === basePath
    }
    return pathname?.startsWith(fullHref)
  }

  const handleToggleGroup = (groupLabel: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }))
  }

  const renderNavItem = (item: NavItem) => {
    const fullHref = item.href ? `${basePath}/${item.href}` : basePath
    const active = isActive(item.href)

    return (
      <Link
        key={item.label}
        href={fullHref}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-blue-50 text-blue-600"
            : "text-slate-600 hover:bg-gray-50 hover:text-gray-900",
        )}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    )
  }

  const renderGroup = (group: NavGroup) => {
    const isCollapsed = collapsed[group.label] ?? false

    return (
      <div key={group.label} className="space-y-2">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-expanded={!isCollapsed}
          onClick={() => group.collapsible && handleToggleGroup(group.label)}
        >
          <span>{group.label}</span>
          {group.collapsible && (
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", isCollapsed ? "-rotate-90" : "rotate-0")}
            />
          )}
        </button>
        <div className={cn("space-y-1 pl-1", group.collapsible && isCollapsed && "hidden")}
        >
          {group.items.map(renderNavItem)}
        </div>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-sm font-semibold text-gray-600">
            {subdomain.slice(0, 2).toUpperCase() || "RB"}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Restaurant</p>
            <span className="text-sm font-semibold text-gray-900">{subdomain || "Dashboard"}</span>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {NAV_SECTIONS.map(renderGroup)}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between rounded-lg bg-gray-100 p-1 text-xs font-medium text-gray-600">
          <button className="flex-1 rounded-md bg-white py-1 text-center shadow-sm" type="button">
            English
          </button>
          <button className="flex-1 rounded-md py-1 text-center text-gray-500" type="button">
            عربي
          </button>
        </div>
        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <Link href="/support" className="flex items-center gap-2 hover:text-gray-900">
            <LifeBuoy className="h-4 w-4" />
            Need help?
          </Link>
          <Link href="/changelog" className="flex items-center gap-2 hover:text-gray-900">
            <Megaphone className="h-4 w-4" />
            What&apos;s new?
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
          >
            <Menu className="h-4 w-4" />
            Close menu
          </button>
        </div>
      </div>
    </aside>
  )
}
