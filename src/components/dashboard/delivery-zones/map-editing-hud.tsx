"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatArea, formatDistance, type GeometryMetrics } from "@/lib/geometry"
import type { DeliveryZone } from "@/lib/types/delivery-zones"
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
  const vertexLabel = metrics?.vertexCount ? `${metrics.vertexCount} vertices` : undefined

  return (
    <div className="bg-white/95 backdrop-blur-sm border shadow-lg rounded-lg p-4 w-full max-w-sm text-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Active zone</p>
          <p className="font-semibold text-foreground leading-tight">
            {zone?.name || (zone?.zone_type === "polygon" ? "New polygon zone" : "New circle zone")}
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Magnet className="h-3 w-3" />
          {snapEnabled ? `Snap ${snapGridSize}m` : "Snap off"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <p className="text-muted-foreground">Area</p>
          <p className="font-medium text-foreground">{areaLabel}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Perimeter</p>
          <p className="font-medium text-foreground">{perimeterLabel}</p>
        </div>
        {radiusLabel && (
          <div className="space-y-1">
            <p className="text-muted-foreground">Radius</p>
            <p className="font-medium text-foreground">{radiusLabel}</p>
          </div>
        )}
        {vertexLabel && (
          <div className="space-y-1">
            <p className="text-muted-foreground">Vertices</p>
            <p className="font-medium text-foreground">{vertexLabel}</p>
          </div>
        )}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground leading-snug">
        <p>
          {isNewZone
            ? "Save the zone from the form to store it permanently."
            : hasPendingChanges
              ? "Geometry changes are pending. Save or revert before leaving."
              : "Geometry is up to date."}
        </p>
        <p>Right-click a vertex to delete it. Drag midpoints to add new ones.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={onConfirmChanges}
          disabled={!hasPendingChanges || isSaving || isNewZone}
          className="flex items-center gap-1"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save geometry
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onRevertChanges}
          disabled={isSaving || (!hasPendingChanges && !isNewZone)}
          className="flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          {isNewZone ? "Discard" : "Revert"}
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
            Delete
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
          Exit
        </Button>
      </div>
    </div>
  )
}
