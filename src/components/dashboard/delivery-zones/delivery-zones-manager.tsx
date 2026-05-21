"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import LeafletMap from "./leaflet-map"
import ZoneLegend from "./zone-legend"
import MapControls from "./map-controls"
import ZoneEditorForm from "./zone-editor-form"
import MapEditingHud from "./map-editing-hud"
import { Button } from "@/components/ui/button"
import { Plus, MapPin } from "lucide-react"
import { ZonesAPI } from "@/lib/api/zones"
import type {
  DeliveryZone,
  CreateDeliveryZoneRequest,
  CircleGeometry,
  PolygonGeometry,
} from "@/types/delivery-zones"
import {
  calculateGeometryMetrics,
  cloneGeometry,
  geometryEquals,
  getGeometryCenter,
  type GeometryMetrics,
} from "@/lib/geometry"
import { subtractPolygonOverlaps } from "@/lib/zone-topology"

interface DeliveryZonesManagerProps {
  className?: string
  entityId: string | null
  entityType?: "restaurant" | "supermarket"
}

const SNAP_GRID_SIZE_METERS = 50
const CAIRO_CENTER: [number, number] = [30.0444, 31.2357]

export default function DeliveryZonesManager({
  className = "",
  entityId,
  entityType = "restaurant",
}: DeliveryZonesManagerProps) {
  const isSupermarket = entityType === "supermarket"
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [isCreatingZone, setIsCreatingZone] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [drawingMode, setDrawingMode] = useState<"circle" | "polygon" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [draftGeometry, setDraftGeometry] = useState<CircleGeometry | PolygonGeometry | null>(null)
  const [originalGeometry, setOriginalGeometry] = useState<CircleGeometry | PolygonGeometry | null>(null)
  const [geometryMetrics, setGeometryMetrics] = useState<GeometryMetrics | null>(null)
  const [hasPendingGeometryChanges, setHasPendingGeometryChanges] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)

  const loadZones = useCallback(
    async (currentEntityId: string) => {
      try {
        setIsLoading(true)
        const fetchedZones = await ZonesAPI.getZones(currentEntityId, entityType)
        setZones(fetchedZones)
        console.log("[v0] Loaded zones:", fetchedZones.length)
      } catch (error) {
        console.error("[v0] Error loading zones:", error)
        toast.error("Не удалось загрузить зоны доставки")
      } finally {
        setIsLoading(false)
      }
    },
    [entityType],
  )

  useEffect(() => {
    if (!entityId) {
      setZones([])
      setIsLoading(false)
      return
    }

    void loadZones(entityId)
  }, [loadZones, entityId])

  const sanitizeGeometryForZone = useCallback(
    (
      zoneId: string,
      geometry: CircleGeometry | PolygonGeometry,
    ): CircleGeometry | PolygonGeometry => {
      if (geometry.type !== "Polygon") {
        return geometry
      }

      const blockers = zones
        .filter((zone) => zone.id !== zoneId)
        .map((zone) => zone.geometry)
        .filter((geom): geom is PolygonGeometry => geom.type === "Polygon")

      if (!blockers.length) {
        return geometry
      }

      return subtractPolygonOverlaps(geometry, blockers)
    },
    [zones],
  )

  const beginGeometryEditing = useCallback(
    (zone: DeliveryZone, options: { markPending?: boolean } = {}) => {
      const baseGeometry = zone.geometry as CircleGeometry | PolygonGeometry | null
      let processedGeometry = baseGeometry ? cloneGeometry(baseGeometry) : null

      if (processedGeometry) {
        processedGeometry = sanitizeGeometryForZone(zone.id, processedGeometry)
      }

      const finalGeometry = processedGeometry ? cloneGeometry(processedGeometry) : null

      setEditingZone({ ...zone, geometry: finalGeometry ?? zone.geometry })
      setSelectedZone(zone)
      setDraftGeometry(finalGeometry)
      setOriginalGeometry(finalGeometry ? cloneGeometry(finalGeometry) : null)
      setGeometryMetrics(finalGeometry ? calculateGeometryMetrics(finalGeometry) : null)
      setHasPendingGeometryChanges(Boolean(options.markPending && finalGeometry))
    },
    [sanitizeGeometryForZone],
  )

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (!drawingMode || !isCreatingZone) return
      if (isSupermarket && drawingMode === "circle") return

      console.log("[v0] Map clicked for zone creation:", lat, lng, drawingMode)

      // Only handle circle creation here, polygon creation is handled by the map component
      if (drawingMode === "circle") {
        const geometry: CircleGeometry = {
          type: "Point",
          coordinates: [lng, lat],
          properties: { radius: 1000 }, // Default 1km radius
        }

        const newZone: DeliveryZone = {
          id: "new",
          restaurantId: entityType === "restaurant" ? entityId ?? "" : undefined,
          supermarketId: entityType === "supermarket" ? entityId ?? "" : undefined,
          name: `New circle zone`,
          description: "",
          delivery_fee: 0,
          color: "#3B82F6",
          is_active: true,
          zone_type: "circle",
          geometry,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        beginGeometryEditing(newZone, { markPending: true })
        setDrawingMode(null)
      }
    },
    [drawingMode, isCreatingZone, beginGeometryEditing, entityId, entityType, isSupermarket],
  )

  const handlePolygonComplete = useCallback(
    (coordinates: [number, number][]) => {
      if (!isCreatingZone || drawingMode !== "polygon") return

      console.log("[v0] Polygon completed with", coordinates.length, "points")

      // Convert coordinates to GeoJSON format
      const geoJsonCoords = coordinates.map(([lat, lng]) => [lng, lat])
      geoJsonCoords.push(geoJsonCoords[0]) // Close the polygon

      const geometry: PolygonGeometry = {
        type: "Polygon",
        coordinates: [geoJsonCoords],
      }

      const newZone: DeliveryZone = {
        id: "new",
        restaurantId: entityType === "restaurant" ? entityId ?? "" : undefined,
        supermarketId: entityType === "supermarket" ? entityId ?? "" : undefined,
        name: `New polygon zone`,
        description: "",
        delivery_fee: 0,
        color: "#3B82F6",
        is_active: true,
        zone_type: "polygon",
        geometry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      beginGeometryEditing(newZone, { markPending: true })
      setDrawingMode(null)
    },
    [isCreatingZone, drawingMode, beginGeometryEditing, entityId, entityType],
  )

  const handleGeometryDraftChange = useCallback(
    (zoneId: string, geometry: CircleGeometry | PolygonGeometry, metrics: GeometryMetrics) => {
      if (!editingZone) return

      const isCurrentZone =
        zoneId === editingZone.id || (editingZone.id === "new" && zoneId === "new")

      if (!isCurrentZone) return

      const sanitizedGeometry = sanitizeGeometryForZone(zoneId, geometry)
      const nextGeometry = cloneGeometry(sanitizedGeometry)
      const nextMetrics = calculateGeometryMetrics(nextGeometry)

      setDraftGeometry(nextGeometry)
      setGeometryMetrics(nextMetrics)
      setEditingZone((prev) => (prev ? { ...prev, geometry: nextGeometry } : prev))

      const pending =
        editingZone.id === "new" ||
        !originalGeometry ||
        !geometryEquals(nextGeometry, originalGeometry)

      setHasPendingGeometryChanges(pending)
    },
    [editingZone, originalGeometry, sanitizeGeometryForZone],
  )

  const handleConfirmGeometryChanges = useCallback(async () => {
    if (!editingZone || !draftGeometry || editingZone.id === "new") return
    if (!entityId) {
      toast.error("Данные объекта неполные")
      return
    }

    try {
      setIsSaving(true)
      const updatedZone = await ZonesAPI.updateZone(entityId, editingZone.id, entityType, {
        geometry: draftGeometry,
      })
      setZones((prev) => prev.map((z) => (z.id === updatedZone.id ? updatedZone : z)))
      beginGeometryEditing(updatedZone)
      toast.success("Геометрия зоны сохранена")
    } catch (error) {
      console.error("[v0] Error saving geometry:", error)
      toast.error("Не удалось сохранить изменения геометрии")
    } finally {
      setIsSaving(false)
    }
  }, [beginGeometryEditing, draftGeometry, editingZone, entityId, entityType])

  const handleCancelEdit = useCallback(() => {
    setEditingZone(null)
    setSelectedZone(null)
    setDraftGeometry(null)
    setOriginalGeometry(null)
    setGeometryMetrics(null)
    setHasPendingGeometryChanges(false)
    setIsCreatingZone(false)
    setDrawingMode(null)
    setEditMode(false)
  }, [])

  const mapCenter = useMemo<[number, number]>(() => {
    const normalizeGeometry = (
      geometry: CircleGeometry | PolygonGeometry | null | undefined,
    ): CircleGeometry | PolygonGeometry | null => {
      if (!geometry) return null
      if (geometry.type === "Point" || geometry.type === "Polygon") {
        return geometry
      }
      return null
    }

    const prioritized: Array<CircleGeometry | PolygonGeometry | null> = [
      draftGeometry,
      normalizeGeometry(editingZone?.geometry as CircleGeometry | PolygonGeometry),
      normalizeGeometry(selectedZone?.geometry as CircleGeometry | PolygonGeometry),
      ...zones
        .filter((zone) => zone.is_active)
        .map((zone) => normalizeGeometry(zone.geometry as CircleGeometry | PolygonGeometry)),
      ...zones.map((zone) => normalizeGeometry(zone.geometry as CircleGeometry | PolygonGeometry)),
    ]

    for (const geometry of prioritized) {
      const center = getGeometryCenter(geometry)
      if (center) {
        return [center.lat, center.lng]
      }
    }

    return CAIRO_CENTER
  }, [draftGeometry, editingZone, selectedZone, zones])

  const handleRevertGeometryChanges = useCallback(() => {
    if (!editingZone) return

    if (editingZone.id === "new") {
      handleCancelEdit()
      return
    }

    if (!originalGeometry) return

    const restored = cloneGeometry(originalGeometry)
    setDraftGeometry(restored)
    setEditingZone((prev) => (prev ? { ...prev, geometry: restored } : prev))
    setGeometryMetrics(calculateGeometryMetrics(restored))
    setHasPendingGeometryChanges(false)
  }, [editingZone, originalGeometry, handleCancelEdit])

  const handleZoneClick = (zone: DeliveryZone) => {
    setSelectedZone(zone)
    setIsCreatingZone(false)
    setDrawingMode(null)

    if (!editMode) {
      setEditMode(true)
    }

    beginGeometryEditing(zone)
  }

  const handleZoneToggle = async (zone: DeliveryZone) => {
    if (!entityId) {
      toast.error("Данные объекта неполные")
      return
    }
    try {
      const updatedZone = await ZonesAPI.updateZone(entityId, zone.id, entityType, {
        is_active: !zone.is_active,
      })

      setZones((prev) => prev.map((z) => (z.id === zone.id ? updatedZone : z)))
      toast.success(updatedZone.is_active ? "Зона включена" : "Зона отключена")
    } catch (error) {
      console.error("[v0] Error toggling zone:", error)
      toast.error("Не удалось обновить статус зоны")
    }
  }

  const handleToggleEditMode = useCallback(() => {
    if (editMode) {
      setEditMode(false)
      setIsCreatingZone(false)
      setDrawingMode(null)
      setEditingZone(null)
      setDraftGeometry(null)
      setOriginalGeometry(null)
      setGeometryMetrics(null)
      setHasPendingGeometryChanges(false)
    } else {
      setEditMode(true)
      if (selectedZone) {
        beginGeometryEditing(selectedZone)
      }
    }
  }, [beginGeometryEditing, editMode, selectedZone])

  const handleSaveZone = async (
    zoneData: CreateDeliveryZoneRequest | (Partial<DeliveryZone> & { id: string }),
  ) => {
    if (!entityId) {
      toast.error("Данные объекта неполные")
      return
    }
    try {
      setIsSaving(true)

      if ("id" in zoneData && zoneData.id !== "new") {
        const payload: Partial<DeliveryZone> = {
          ...zoneData,
          restaurantId: entityType === "restaurant" ? entityId : zoneData.restaurantId,
          supermarketId: entityType === "supermarket" ? entityId : zoneData.supermarketId,
        }

        if (draftGeometry) {
          payload.geometry = draftGeometry
        }

        const updatedZone = await ZonesAPI.updateZone(entityId, zoneData.id, entityType, payload)
        setZones((prev) => prev.map((z) => (z.id === zoneData.id ? updatedZone : z)))
        beginGeometryEditing(updatedZone)
        toast.success("Зона обновлена")
      } else {
        if (!draftGeometry) {
          toast.error("Нарисуйте зону доставки на карте перед сохранением")
          return
        }

        const source = zoneData as CreateDeliveryZoneRequest
        const newZonePayload = {
          name: source.name,
          description: source.description,
          delivery_fee: source.delivery_fee,
          color: source.color,
          zone_type: source.zone_type,
          geometry: draftGeometry,
          is_active: source.is_active,
        }

        const newZone = await ZonesAPI.createZone(entityId, entityType, newZonePayload)
        setZones((prev) => [...prev, newZone])
        beginGeometryEditing(newZone)
        setIsCreatingZone(false)
        toast.success("Зона создана")
      }

      setHasPendingGeometryChanges(false)
      setDrawingMode(null)
    } catch (error) {
      console.error("[v0] Error saving zone:", error)
      toast.error("Не удалось сохранить зону")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteZone = useCallback(async (zoneId: string) => {
    if (!entityId) {
      toast.error("Данные объекта неполные")
      return
    }
    try {
      await ZonesAPI.deleteZone(entityId, zoneId, entityType)
      setZones((prev) => prev.filter((z) => z.id !== zoneId))
      setEditingZone(null)
      setSelectedZone(null)
      setDraftGeometry(null)
      setOriginalGeometry(null)
      setGeometryMetrics(null)
      setHasPendingGeometryChanges(false)
      setIsCreatingZone(false)
      toast.success("Зона удалена")
    } catch (error) {
      console.error("[v0] Error deleting zone:", error)
      toast.error("Не удалось удалить зону")
    }
  }, [entityId, entityType])

  const handleDeleteCurrentZone = useCallback(() => {
    if (!editingZone || editingZone.id === "new") return
    if (window.confirm(`Удалить "${editingZone.name}"? Это действие нельзя отменить.`)) {
      void handleDeleteZone(editingZone.id)
    }
  }, [editingZone, handleDeleteZone])

  const startCreatingZone = () => {
    if (!entityId) {
      toast.error("Не найден контекст зоны доставки")
      return
    }
    setIsCreatingZone(true)
    setEditMode(true)
    setDrawingMode(isSupermarket ? "polygon" : "circle")
    setEditingZone(null)
    setSelectedZone(null)
    setDraftGeometry(null)
    setOriginalGeometry(null)
    setGeometryMetrics(null)
    setHasPendingGeometryChanges(false)
  }

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Загрузка зон доставки...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} flex flex-col lg:flex-row gap-4 h-full`}>
      {/* Sidebar */}
      <div className="w-full lg:w-[360px] flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)]">
        {/* Create Zone Button */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">Зоны доставки</h1>
              <p className="text-xs text-muted-foreground">
                Настройте зоны доставки и тарифы.
              </p>
            </div>
            <Button onClick={startCreatingZone} disabled={isCreatingZone || !entityId}>
              <Plus className="h-4 w-4 mr-2" />
              Новая зона
            </Button>
          </div>
        </div>

        {/* Zone Editor Form */}
        {editingZone && entityId && (
          <ZoneEditorForm
            zone={editingZone.id === "new" ? null : editingZone}
            entityId={entityId}
            entityType={entityType}
            onSave={handleSaveZone}
            onDelete={editingZone.id !== "new" ? handleDeleteZone : undefined}
            onCancel={handleCancelEdit}
            isLoading={isSaving}
            allowedZoneTypes={isSupermarket ? ["polygon"] : ["circle", "polygon"]}
          />
        )}

        {/* Zone Legend */}
        {!editingZone && (
          <ZoneLegend
            zones={zones}
            selectedZone={selectedZone}
            onZoneSelect={handleZoneClick}
            onZoneToggle={handleZoneToggle}
            className="flex-1 min-h-[280px] lg:min-h-0"
          />
        )}

        {/* Instructions */}
        {isCreatingZone && drawingMode && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">
                Создание зоны: {drawingMode === "circle" ? "круг" : "полигон"}
              </p>
            </div>
            {drawingMode === "circle" ? (
              <p className="text-xs text-muted-foreground">Нажмите на карту, чтобы выбрать центр круговой зоны</p>
            ) : (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Нажимайте на карту, чтобы нарисовать полигон</p>
                <p>• Дважды нажмите, чтобы завершить рисование</p>
                <p>• Для корректной зоны нужно минимум 3 точки</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative min-h-[500px] lg:min-h-0">
        <LeafletMap
          zones={zones}
          onZoneClick={handleZoneClick}
          onMapClick={handleMapClick}
          onPolygonComplete={handlePolygonComplete}
          onGeometryChange={handleGeometryDraftChange}
          selectedZone={selectedZone}
          editingZone={editingZone}
          draftGeometry={draftGeometry}
          editMode={editMode}
          drawingMode={drawingMode}
          snapToGrid={snapToGrid}
          snapGridSize={SNAP_GRID_SIZE_METERS}
          center={mapCenter}
          className="h-full rounded-lg border"
        />

        {/* Map Controls */}
        <MapControls
          editMode={editMode}
          drawingMode={drawingMode}
          onToggleEditMode={handleToggleEditMode}
          onSetDrawingMode={setDrawingMode}
          snapToGrid={snapToGrid}
          onToggleSnap={setSnapToGrid}
          allowCircle={!isSupermarket}
          className="absolute top-4 right-4 z-[1000]"
        />

        {editMode && editingZone && (
          <div className="absolute bottom-4 left-4 z-[1000] w-full max-w-sm">
            <MapEditingHud
              zone={editingZone}
              metrics={geometryMetrics}
              hasPendingChanges={hasPendingGeometryChanges}
              isSaving={isSaving}
              snapEnabled={snapToGrid}
              snapGridSize={SNAP_GRID_SIZE_METERS}
              onConfirmChanges={handleConfirmGeometryChanges}
              onRevertChanges={handleRevertGeometryChanges}
              onDeleteZone={editingZone.id !== "new" ? handleDeleteCurrentZone : undefined}
              onExitEditing={handleCancelEdit}
            />
          </div>
        )}
      </div>
    </div>
  )
}
