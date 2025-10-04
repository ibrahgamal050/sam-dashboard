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
  className = "",
}: MapControlsProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Zoom Controls */}
      <Card className="p-1">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" onClick={onZoomIn} className="h-8 w-8 p-0" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onZoomOut} className="h-8 w-8 p-0" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onResetView} className="h-8 w-8 p-0" title="Reset View">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Edit Mode Toggle */}
      <Card className="p-1">
        <Button
          variant={editMode ? "default" : "ghost"}
          size="sm"
          onClick={onToggleEditMode}
          className="h-8 w-8 p-0"
          title={editMode ? "Exit Edit Mode" : "Enter Edit Mode"}
        >
          {editMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </Card>

      {/* Drawing Tools */}
      {editMode && (
        <Card className="p-1">
          <div className="flex flex-col gap-1">
            <Button
              variant={drawingMode === "circle" ? "default" : "ghost"}
              size="sm"
              onClick={() => onSetDrawingMode?.(drawingMode === "circle" ? null : "circle")}
              className="h-8 w-8 p-0"
              title="Draw Circle Zone"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={drawingMode === "polygon" ? "default" : "ghost"}
              size="sm"
              onClick={() => onSetDrawingMode?.(drawingMode === "polygon" ? null : "polygon")}
              className="h-8 w-8 p-0"
              title="Draw Polygon Zone"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {editMode && (
        <Card className="p-1">
          <Button
            variant={snapToGrid ? "default" : "ghost"}
            size="sm"
            onClick={() => onToggleSnap?.(!snapToGrid)}
            className="h-8 w-8 p-0"
            title={snapToGrid ? "Disable snapping" : "Enable snapping"}
          >
            <Magnet className="h-4 w-4" />
          </Button>
        </Card>
      )}

      {editMode && (
        <Card className="p-2">
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              {drawingMode ? `Drawing ${drawingMode}` : "Edit Mode"}
            </Badge>
            {drawingMode === "polygon" && (
              <p className="text-xs text-muted-foreground mt-1">Click points, double-click to finish</p>
            )}
            {drawingMode === "circle" && (
              <p className="text-xs text-muted-foreground mt-1">Click on map to create zone</p>
            )}
            {!drawingMode && (
              <p className="text-xs text-muted-foreground mt-1">
                {snapToGrid
                  ? "Snapping enabled • handles align to grid"
                  : "Snapping off • freeform adjustments"}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
