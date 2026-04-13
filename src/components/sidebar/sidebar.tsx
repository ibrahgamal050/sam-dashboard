"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
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
  Download as DownloadIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type SidebarProps = {
  subdomain?: string
  isOpen?: boolean
  onClose?: () => void
}

type NavItem = {
  label: string
  href: string | ((context: { subdomain: string; retailSlug: string }) => string)
  icon: React.ElementType
}

type NavGroup = {
  label: string
  items: NavItem[]
  collapsible?: boolean
}

export function Sidebar({ subdomain: subdomainProp, isOpen = false, onClose }: SidebarProps) {
  const params = useParams()
  const fallbackSubdomain = Array.isArray(params?.subdomain)
    ? params.subdomain[0]
    : (params?.subdomain as string) ?? ""
  const subdomain = subdomainProp ?? fallbackSubdomain

  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [retailSlug, setRetailSlug] = useState(subdomain || "")
  const [tenantType, setTenantType] = useState<"restaurant" | "supermarket" | "unknown">("unknown")
  const isRetailContext = Boolean(pathname?.includes("/dashboard/") && pathname?.includes("/retail"))

  const basePath = useMemo(() => `/dashboard/${subdomain}`.replace(/\/+$/, ""), [subdomain])
  const brandShort = (subdomain || "MZ").slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!subdomain) return
    setRetailSlug(subdomain)
    let active = true
    const storedKey = `meelza.retailSlug.${subdomain}`
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storedKey) : null
    if (stored) {
      setRetailSlug(stored)
      return
    }
    const fetchSlug = async () => {
      try {
        const res = await fetch(`/api/retail/resolve?key=${encodeURIComponent(subdomain)}`)
        if (!res.ok) return
        const data = await res.json()
        const slug = data?.slug
        if (active && slug) {
          setRetailSlug(slug)
          if (typeof window !== "undefined") {
            window.localStorage.setItem(storedKey, slug)
          }
        }
      } catch {
        // ignore
      }
    }
    fetchSlug()
    return () => {
      active = false
    }
  }, [subdomain])

  useEffect(() => {
    if (!subdomain || isRetailContext) {
      if (isRetailContext) setTenantType("supermarket")
      return
    }
    let active = true
    const loadTenantType = async () => {
      try {
        const res = await fetch(`/api/retail/supermarkets/slug/${encodeURIComponent(subdomain)}`)
        if (!active) return
        setTenantType(res.ok ? "supermarket" : "restaurant")
      } catch {
        if (!active) return
        setTenantType("restaurant")
      }
    }
    loadTenantType()
    return () => {
      active = false
    }
  }, [subdomain, isRetailContext])

  const isSupermarket = isRetailContext || tenantType === "supermarket"

  const resolveHref = (href: NavItem["href"]) => {
    if (typeof href === "function") return href({ subdomain, retailSlug: retailSlug || subdomain })
    if (href.startsWith("/")) return href
    return href ? `${basePath}/${href}` : basePath
  }

  const isActive = (href: NavItem["href"]) => {
    const fullHref = resolveHref(href)
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

  const handleMaybeClose = () => {
    if (!onClose) return
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
    if (!isDesktop) onClose()
  }

  const navSections = useMemo<NavGroup[]>(() => {
    const catalogPrimaryItem: NavItem = isSupermarket
      ? { label: "كتالوج السوبرماركت", href: ({ subdomain }) => `/dashboard/${subdomain}/retail`, icon: ShoppingBag }
      : { label: "المنيو", href: "menu", icon: ShoppingBag }

    return [
      {
        label: "نظرة عامة",
        items: [
          { label: "الرئيسية", href: "", icon: Home },
          { label: "الطلبات", href: "orders", icon: ClipboardList },
          { label: "العملاء", href: "customers", icon: Users },
          { label: "التحليلات", href: "analytics", icon: BarChart3 },
        ],
      },
      {
        label: "الكتالوج",
        collapsible: true,
        items: [
          catalogPrimaryItem,
        ],
      },
      {
        label: "التشغيل",
        collapsible: true,
        items: [
          { label: "مناطق التوصيل", href: "delivery-zones", icon: Map },
          { label: "الإعدادات", href: "settings", icon: Settings },
        ],
      },
    ]
  }, [isSupermarket])

  const renderNavItem = (item: NavItem) => {
    const fullHref = resolveHref(item.href)
    const active = isActive(item.href)

    return (
      <Link
        key={item.label}
        href={fullHref}
        onClick={handleMaybeClose}
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all",
          active
            ? "bg-[#7ab8f5] shadow-[0_14px_30px_rgba(70,182,255,0.35)]"
            : "text-slate-600 hover:bg-white hover:text-slate-800",
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition",
            active ? "border-transparent bg-white/15 text-white" : "group-hover:border-slate-200",
          )}
        >
          <item.icon className="h-4 w-4" />
        </div>
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
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          aria-expanded={!isCollapsed}
          onClick={() => group.collapsible && handleToggleGroup(group.label)}
        >
          <span>{group.label}</span>
          {group.collapsible && (
            <ChevronDown
              className={cn("h-4 w-4 transition-transform text-slate-400", isCollapsed ? "-rotate-90" : "rotate-0")}
            />
          )}
        </button>
        <div className={cn("space-y-1 pr-1", group.collapsible && isCollapsed && "hidden")}>{group.items.map(renderNavItem)}</div>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-50 flex h-dvh w-72 flex-col border-l border-slate-200 bg-white  text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.15)] transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        "lg:translate-x-0",
      )}
    >
      <div className="relative px-5 py-6">
        <div className="rounded-2xl border border-slate-200 bg-[#e9f4ff] px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f2ff] text-base font-bold text-[#1f6fb2] shadow-sm">
              {brandShort}
            </div>
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">لوحة التحكم</p>
              <span className="text-base font-semibold text-slate-800">{subdomain || "لوحة تحكم ميلزا"}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="absolute left-5 top-7 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 lg:hidden"
          onClick={onClose}
          aria-label="إغلاق الشريط الجانبي"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        {navSections.map(renderGroup)}
      </nav>

      
    </aside>
  )
}
