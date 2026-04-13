"use client"

import { useMemo, useState } from "react"
import type { DeliveryZone } from "@/types/delivery-zones"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, EyeOff, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ZoneLegendProps {
  zones: DeliveryZone[]
  selectedZone?: DeliveryZone | null
  onZoneSelect?: (zone: DeliveryZone) => void
  onZoneToggle?: (zone: DeliveryZone) => void
  className?: string
}

export default function ZoneLegend({
  zones,
  selectedZone,
  onZoneSelect,
  onZoneToggle,
  className = "",
}: ZoneLegendProps) {
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"all" | "active" | "inactive">("active")

  const normalizedQuery = query.trim().toLowerCase()

  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      const matchesQuery = !normalizedQuery || zone.name.toLowerCase().includes(normalizedQuery)
      const matchesView =
        view === "all" || (view === "active" ? zone.is_active : !zone.is_active)
      return matchesQuery && matchesView
    })
  }, [zones, normalizedQuery, view])

  const activeZones = useMemo(
    () => filteredZones.filter((zone) => zone.is_active),
    [filteredZones],
  )
  const inactiveZones = useMemo(
    () => filteredZones.filter((zone) => !zone.is_active),
    [filteredZones],
  )

  const totalActive = zones.filter((zone) => zone.is_active).length
  const totalInactive = zones.filter((zone) => !zone.is_active).length

  const renderZone = (zone: DeliveryZone) => (
    <div
      key={zone.id}
      className={cn(
        "group flex items-center justify-between rounded-xl border px-3 py-3 transition-all",
        selectedZone?.id === zone.id
          ? "border-primary bg-primary/5 shadow-sm"
          : "hover:border-muted-foreground/30 hover:bg-muted/30",
      )}
      onClick={() => onZoneSelect?.(zone)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onZoneSelect?.(zone)
        }
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-inner"
          style={{ backgroundColor: zone.color, borderColor: zone.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{zone.name}</p>
            <Badge variant={zone.is_active ? "default" : "secondary"} className="text-[10px]">
              {zone.is_active ? "نشطة" : "مخفية"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className="capitalize">{zone.zone_type === "circle" ? "دائرة" : "مضلع"}</span>
            <span>•</span>
            <span>رسوم {zone.delivery_fee} ج</span>
          </div>
        </div>
      </div>
      {onZoneToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onZoneToggle(zone)
          }}
          className="ml-2 h-8 w-8 p-0 opacity-70 transition group-hover:opacity-100"
          title={zone.is_active ? "إخفاء المنطقة" : "إظهار المنطقة"}
        >
          {zone.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      )}
    </div>
  )

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">مناطق التوصيل</CardTitle>
            <p className="text-xs text-muted-foreground">
              {totalActive} نشطة · {totalInactive} مخفية
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {zones.length} إجمالي
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث عن منطقة..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {(["active", "inactive", "all"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={view === option ? "default" : "outline"}
              className="h-8 px-3 capitalize"
              onClick={() => setView(option)}
            >
              {option === "active" ? "نشطة" : option === "inactive" ? "مخفية" : "الكل"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-2">
          <div className="space-y-3">
            {view !== "inactive" && activeZones.length > 0 && (
              <div className="space-y-2">
                {view === "all" && (
                  <p className="text-xs font-semibold text-muted-foreground">مناطق نشطة</p>
                )}
                {activeZones.map((zone) => renderZone(zone))}
              </div>
            )}

            {view !== "active" && inactiveZones.length > 0 && (
              <div className="space-y-2 pt-2">
                {view === "all" && (
                  <p className="text-xs font-semibold text-muted-foreground">مناطق مخفية</p>
                )}
                {inactiveZones.map((zone) => renderZone(zone))}
              </div>
            )}

            {filteredZones.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">لا توجد مناطق مطابقة للتصفية</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
