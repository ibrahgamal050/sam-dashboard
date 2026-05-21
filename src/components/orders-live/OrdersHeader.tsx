"use client"

import * as React from "react"
import { BellOff, ChevronDown, Plus, RefreshCw, Search, Settings, Flag, BookOpen, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/locale"

type TabKey = "biller" | "receiver" | "settings"

type Props = {
  brandName?: string
  lang?: Locale
  activeTab?: TabKey
  onTabChange?: (tab: TabKey) => void

  // actions row
  allBrandsLabel?: string
  onlineCountText?: string

  searchValue?: string
  onSearchChange?: (v: string) => void

  isMuted?: boolean
  onToggleMute?: () => void

  onRefresh?: () => void
  onReport?: () => void
  onOpenAllOrders?: () => void

  isOnline?: boolean
  onToggleOnline?: (v: boolean) => void

  allOrdersLabel?: string
}

export default function OrdersHeader({
  brandName = "FoodMagic",
  lang = "ar",
  activeTab = "biller",
  onTabChange,

  allBrandsLabel,
  onlineCountText,

  searchValue = "",
  onSearchChange,

  isMuted = true,
  onToggleMute,

  onRefresh,
  onReport,
  onOpenAllOrders,

  isOnline = true,
  onToggleOnline,

  allOrdersLabel,
}: Props) {
  const resolvedAllBrandsLabel = allBrandsLabel ?? "Все филиалы"
  const resolvedOnlineCountText = onlineCountText ?? "3/5 каналов онлайн"
  const resolvedAllOrdersLabel = allOrdersLabel ?? "Все заказы"
  const searchPlaceholder = "Поиск по токену или ID заказа"

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
            {/* simple mark */}
            <div className="h-4 w-4 rounded-full bg-orange-500" />
          </div>
          <div className="text-sm font-semibold text-[#1b1b1b]">{brandName}</div>
        </div>

        {/* Center: Tabs */}
        <nav className="hidden items-center gap-2 md:flex">
          <Tab
            active={activeTab === "biller"}
            onClick={() => onTabChange?.("biller")}
            icon={<span className="text-[11px] font-bold">▦</span>}
            label="Касса"
            badge="23"
          />
          <Tab
            active={activeTab === "receiver"}
            onClick={() => onTabChange?.("receiver")}
            icon={<span className="text-[11px] font-bold">↩</span>}
            label="Приём"
            badge="05"
          />
          <Tab
            active={activeTab === "settings"}
            onClick={() => onTabChange?.("settings")}
            icon={<Settings className="h-4 w-4" />}
            label="Настройки"
          />

          <button
            type="button"
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
            aria-label="Добавить"
            title="Добавить"
          >
            <Plus className="h-5 w-5" />
          </button>
        </nav>

        {/* Right: Quick icons + avatar */}
        <div className="flex items-center gap-2">
          <IconBtn title="Меню">
            <BookOpen className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Настройки">
            <Settings className="h-4 w-4" />
          </IconBtn>
          <div className="h-10 w-10 rounded-full bg-orange-500" />
        </div>
      </div>

      {/* Actions row */}
      <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Left: All brands */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#1b1b1b] hover:bg-gray-50"
          >
            {resolvedAllBrandsLabel}
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          <div className="text-xs text-gray-500">{resolvedOnlineCountText}</div>
        </div>

        {/* Center: Search */}
        <div className="relative w-full md:max-w-[520px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-full border border-gray-200 bg-[#F7F7F7] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0EBE7F]/30"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ActionBtn
            onClick={onToggleMute}
            active={!isMuted}
            icon={<BellOff className="h-4 w-4" />}
            label="Без звука"
          />
          <ActionBtn onClick={onRefresh} icon={<RefreshCw className="h-4 w-4" />} label="Обновить" />
          <ActionBtn onClick={onReport} icon={<Flag className="h-4 w-4" />} label="Отчёт" />
          <ActionBtn onClick={onOpenAllOrders} icon={<ListChecks className="h-4 w-4" />} label={resolvedAllOrdersLabel} />

          {/* Online toggle */}
          <div className="ml-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <span className="text-sm font-semibold text-[#1b1b1b]">Онлайн</span>
            <button
              type="button"
              onClick={() => onToggleOnline?.(!isOnline)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                isOnline ? "bg-[#0EBE7F]" : "bg-gray-300"
              )}
              aria-label="Toggle online"
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  isOnline ? "translate-x-[22px]" : "translate-x-[2px]"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ---------- small UI helpers ---------- */

function Tab({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active?: boolean
  icon: React.ReactNode
  label: string
  badge?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors",
        active
          ? "border-gray-200 bg-gray-50 text-[#1b1b1b]"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      )}
    >
      <span className="text-gray-700">{icon}</span>
      <span>{label}</span>
      {badge ? (
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#1b1b1b] shadow-sm">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

function IconBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      title={title}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
    >
      {children}
    </button>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50",
        active && "bg-[#E3F7EE] text-[#1D9F66]"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
