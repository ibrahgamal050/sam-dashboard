"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatArea, formatDistance, type GeometryMetrics } from "@/lib/geometry"
import type { DeliveryZone } from "@/types/delivery-zones"
import { Loader2, RotateCcw, Save, Trash2, XCircle, Magnet } from "lucide-react"

interface MapEditingHudProps {
  zone: DeliveryZone | null
  metrics: GeometryMetrics | null
  hasPendingChanges: boolean
  isSaving?: boolean
  snapEnabled: boolean
  snapGridSize: number
  onConfirmChanges: () => void
  onRevertChanges: () => void
  onDeleteZone?: () => void
  onExitEditing: () => void
}

export default function MapEditingHud({
  zone,
  metrics,
  hasPendingChanges,
  isSaving = false,
  snapEnabled,
  snapGridSize,
  onConfirmChanges,
  onRevertChanges,
  onDeleteZone,
  onExitEditing,
}: MapEditingHudProps) {
  const isNewZone = zone?.id === "new"

  const areaLabel = metrics ? formatArea(metrics.area) : "—"
  const perimeterLabel = metrics ? formatDistance(metrics.perimeter) : "—"
  const radiusLabel = metrics?.radius ? formatDistance(metrics.radius) : undefined
  const vertexLabel = metrics?.vertexCount ? `${metrics.vertexCount} نقطة` : undefined

  return (
    <div className="bg-white/95 backdrop-blur-sm border shadow-xl rounded-2xl p-4 w-full max-w-sm text-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">المنطقة الحالية</p>
          <p className="font-semibold text-foreground leading-tight">
            {zone?.name || (zone?.zone_type === "polygon" ? "منطقة مضلعة جديدة" : "منطقة دائرية جديدة")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <Badge variant={snapEnabled ? "default" : "secondary"} className="flex items-center gap-1">
            <Magnet className="h-3 w-3" />
          {snapEnabled ? `محاذاة ${snapGridSize}م` : "المحاذاة متوقفة"}
        </Badge>
        <Badge variant={hasPendingChanges ? "destructive" : "secondary"} className="text-[10px]">
          {hasPendingChanges ? "تعديلات غير محفوظة" : "محدّث"}
        </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <p className="text-muted-foreground">المساحة</p>
          <p className="font-medium text-foreground">{areaLabel}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">المحيط</p>
          <p className="font-medium text-foreground">{perimeterLabel}</p>
        </div>
        {radiusLabel && (
          <div className="space-y-1">
            <p className="text-muted-foreground">نصف القطر</p>
            <p className="font-medium text-foreground">{radiusLabel}</p>
          </div>
        )}
        {vertexLabel && (
          <div className="space-y-1">
            <p className="text-muted-foreground">النقاط</p>
            <p className="font-medium text-foreground">{vertexLabel}</p>
          </div>
        )}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground leading-snug">
        <p>
          {isNewZone
            ? "احفظ المنطقة من النموذج لتثبيتها نهائيًا."
            : hasPendingChanges
              ? "هناك تعديلات غير محفوظة على الشكل. احفظ أو تراجع قبل المغادرة."
              : "شكل المنطقة محدّث."}
        </p>
        <p>انقر بزر الماوس الأيمن على نقطة لحذفها. اسحب المنتصف لإضافة نقطة جديدة.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={onConfirmChanges}
          disabled={!hasPendingChanges || isSaving || isNewZone}
          className="flex items-center gap-1"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الشكل
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onRevertChanges}
          disabled={isSaving || (!hasPendingChanges && !isNewZone)}
          className="flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          {isNewZone ? "إلغاء" : "تراجع"}
        </Button>
        {zone && zone.id !== "new" && onDeleteZone && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onDeleteZone}
            disabled={isSaving}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onExitEditing}
          disabled={isSaving}
          className="ml-auto flex items-center gap-1"
        >
          <XCircle className="h-4 w-4" />
          إغلاق
        </Button>
      </div>
    </div>
  )
}
