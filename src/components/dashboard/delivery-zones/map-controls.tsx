"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ZoomIn, ZoomOut, RotateCcw, Square, Circle, Edit3, Eye, Magnet } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MapControlsProps {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetView?: () => void
  onToggleEditMode?: () => void
  editMode?: boolean
  drawingMode?: "circle" | "polygon" | null
  onSetDrawingMode?: (mode: "circle" | "polygon" | null) => void
  snapToGrid?: boolean
  onToggleSnap?: (enabled: boolean) => void
  allowCircle?: boolean
  className?: string
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleEditMode,
  editMode = false,
  drawingMode,
  onSetDrawingMode,
  snapToGrid = true,
  onToggleSnap,
  allowCircle = true,
  className = "",
}: MapControlsProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Zoom Controls */}
      <Card className="p-1 rounded-2xl shadow-lg bg-white/95 backdrop-blur border border-white/70">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" onClick={onZoomIn} className="h-8 w-8 p-0" title="تكبير">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onZoomOut} className="h-8 w-8 p-0" title="تصغير">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onResetView} className="h-8 w-8 p-0" title="إعادة التمركز">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Edit Mode Toggle */}
      <Card className="p-1 rounded-2xl shadow-lg bg-white/95 backdrop-blur border border-white/70">
        <Button
          variant={editMode ? "default" : "ghost"}
          size="sm"
          onClick={onToggleEditMode}
          className="h-8 w-8 p-0"
          title={editMode ? "إنهاء وضع التعديل" : "بدء وضع التعديل"}
        >
          {editMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </Card>

      {/* Drawing Tools */}
      {editMode && (
        <Card className="p-1 rounded-2xl shadow-lg bg-white/95 backdrop-blur border border-white/70">
          <div className="flex flex-col gap-1">
            {allowCircle && (
              <Button
                variant={drawingMode === "circle" ? "default" : "ghost"}
                size="sm"
                onClick={() => onSetDrawingMode?.(drawingMode === "circle" ? null : "circle")}
                className="h-8 w-8 p-0"
                title="رسم منطقة دائرية"
              >
                <Circle className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant={drawingMode === "polygon" ? "default" : "ghost"}
              size="sm"
              onClick={() => onSetDrawingMode?.(drawingMode === "polygon" ? null : "polygon")}
              className="h-8 w-8 p-0"
              title="رسم منطقة مضلعة"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {editMode && (
        <Card className="p-1 rounded-2xl shadow-lg bg-white/95 backdrop-blur border border-white/70">
          <Button
            variant={snapToGrid ? "default" : "ghost"}
            size="sm"
            onClick={() => onToggleSnap?.(!snapToGrid)}
            className="h-8 w-8 p-0"
            title={snapToGrid ? "إيقاف المحاذاة" : "تفعيل المحاذاة"}
          >
            <Magnet className="h-4 w-4" />
          </Button>
        </Card>
      )}

      {editMode && (
        <Card className="p-3 rounded-2xl shadow-lg bg-white/95 backdrop-blur border border-white/70">
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              {drawingMode
                ? `الرسم: ${drawingMode === "circle" ? "دائرة" : "مضلع"}`
                : "وضع التعديل"}
            </Badge>
            {drawingMode === "polygon" && (
              <p className="text-xs text-muted-foreground mt-1">انقر نقاطًا، وانقر مرتين للإنهاء</p>
            )}
            {drawingMode === "circle" && (
              <p className="text-xs text-muted-foreground mt-1">انقر على الخريطة لإنشاء المنطقة</p>
            )}
            {!drawingMode && (
              <p className="text-xs text-muted-foreground mt-1">
                {snapToGrid ? "المحاذاة مفعلة • محاذاة ذكية" : "المحاذاة متوقفة • تعديل حر"}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
