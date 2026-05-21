"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { MenuType } from "@/lib/menu-types"

const MENU_TYPE_LABELS: Record<MenuType, string> = {
  delivery: "Доставка",
  dinein: "Зал",
  takeaway: "Самовывоз",
}

type MenuTypeSwitcherProps = {
  value: MenuType
  onChange: (value: MenuType) => void
  onAdd?: (value: MenuType) => void
  className?: string
}

export function MenuTypeSwitcher({ value, onChange, onAdd, className }: MenuTypeSwitcherProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
        {(Object.keys(MENU_TYPE_LABELS) as MenuType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition",
              value === type
                ? "bg-white text-[#2e6fe6] shadow"
                : "text-slate-600 hover:bg-white/70",
            )}
          >
            {MENU_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="rounded-full border-slate-200 px-4 text-xs font-semibold"
        onClick={() => setOpen(true)}
      >
        + Добавить меню
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base">Добавить тип меню</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(Object.keys(MENU_TYPE_LABELS) as MenuType[]).map((type) => (
              <button
                key={`add-${type}`}
                type="button"
                onClick={() => {
                  onAdd?.(type)
                  onChange(type)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm",
                  value === type
                    ? "border-[#2e6fe6] bg-blue-50 text-[#2e6fe6]"
                    : "border-slate-200 text-slate-700 hover:border-slate-300",
                )}
              >
                <span>{MENU_TYPE_LABELS[type]}</span>
                {value === type ? <span className="text-xs">Текущий</span> : null}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
