"use client"

import { useEffect, useRef, useState } from "react"
import type { DeliveryZone, CircleGeometry, PolygonGeometry } from "@/lib/types/delivery-zones"
import {
  calculateGeometryMetrics,
  destinationPoint,
  snapLatLngToGrid,
  snapDistanceToGrid,
  bearingBetweenPoints,
  type GeometryMetrics,
} from "@/lib/geometry"

// Leaflet imports - using dynamic imports to avoid SSR issues
let L: any
let leafletLoaded = false

interface LeafletMapProps {
  zones: DeliveryZone[]
  onZoneClick?: (zone: DeliveryZone) => void
  onMapClick?: (lat: number, lng: number) => void
  onPolygonComplete?: (coordinates: [number, number][]) => void
  onGeometryChange?: (zoneId: string, geometry: CircleGeometry | PolygonGeometry, metrics: GeometryMetrics) => void
  selectedZone?: DeliveryZone | null
  editingZone?: DeliveryZone | null
  draftGeometry?: CircleGeometry | PolygonGeometry | null
  editMode?: boolean
  drawingMode?: "circle" | "polygon" | null
  snapToGrid?: boolean
  snapGridSize?: number
  center?: [number, number]
  zoom?: number
  className?: string
}

export default function LeafletMap({
  zones,
  onZoneClick,
  onMapClick,
  onPolygonComplete,
  onGeometryChange,
  selectedZone,
  editingZone,
  draftGeometry,
  editMode = false,
  drawingMode,
  snapToGrid = true,
  snapGridSize = 25,
  center = [30.0444, 31.2357], // Cairo coordinates fallback
  zoom = 12,
  className = "h-full w-full",
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const drawingLayerRef = useRef<any>(null)
  const polygonPointsRef = useRef<[number, number][]>([])
  const tempMarkersRef = useRef<any[]>([])
  const editingStateRef = useRef<{
    zoneId: string
    type: "circle" | "polygon"
    layer: any
    vertexMarkers?: any[]
    midpointMarkers?: any[]
    centerMarker?: any
    radiusHandle?: any
  } | null>(null)
  const snapToGridRef = useRef(snapToGrid)
  const gridSizeRef = useRef(snapGridSize)
  const [isLoading, setIsLoading] = useState(true)

  const getPolygonLatLngs = (geometry: PolygonGeometry) => {
    const ring = geometry.coordinates?.[0] || []
    const latLngs = ring.map(([lng, lat]) => L.latLng(lat, lng))

    if (latLngs.length > 1) {
      const first = latLngs[0]
      const last = latLngs[latLngs.length - 1]
      if (first.lat === last.lat && first.lng === last.lng) {
        latLngs.pop()
      }
    }

    return latLngs
  }

  const buildPolygonGeometry = (latlngs: any[]): PolygonGeometry => {
    const coordinates = latlngs.map((latlng: any) => [latlng.lng, latlng.lat])
    if (coordinates.length > 0) {
      const [firstLng, firstLat] = coordinates[0]
      const [lastLng, lastLat] = coordinates[coordinates.length - 1]
      if (firstLng !== lastLng || firstLat !== lastLat) {
        coordinates.push([firstLng, firstLat])
      }
    }
    return {
      type: "Polygon",
      coordinates: [coordinates],
    }
  }

  const buildCircleGeometry = (center: any, radius: number): CircleGeometry => {
    return {
      type: "Point",
      coordinates: [center.lng, center.lat],
      properties: { radius },
    }
  }

  const createHandleIcon = (variant: "vertex" | "center" | "radius" | "midpoint") => {
    const baseStyle =
      "width:16px;height:16px;border-radius:9999px;border:2px solid;box-shadow:0 0 6px rgba(0,0,0,0.25);"

    const variantStyles: Record<"vertex" | "center" | "radius" | "midpoint", string> = {
      vertex: `${baseStyle}background:#fee2e2;border-color:#dc2626;`,
      center: `${baseStyle}background:#fef3c7;border-color:#d97706;`,
      radius: `${baseStyle}background:#dbeafe;border-color:#3b82f6;`,
      midpoint: `${baseStyle}background:#e0f2fe;border-color:#0ea5e9;`,
    }

    return L.divIcon({
      className: "zone-handle",
      html: `<div style="${variantStyles[variant]}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
  }

  const createLayerForGeometry = (
    zone: DeliveryZone,
    geometry: CircleGeometry | PolygonGeometry,
    styleOverrides?: Record<string, any>,
  ) => {
    if (geometry.type === "Point") {
      const coords = geometry.coordinates
      const radius = geometry.properties?.radius || 1000
      return L.circle([coords[1], coords[0]], {
        radius,
        fillColor: zone.color,
        color: zone.color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.3,
        ...styleOverrides,
      })
    }

    const latLngs = getPolygonLatLngs(geometry as PolygonGeometry).map((latlng: any) => [latlng.lat, latlng.lng])

    return L.polygon(latLngs, {
      fillColor: zone.color,
      color: zone.color,
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.3,
      ...styleOverrides,
    })
  }

  useEffect(() => {
    snapToGridRef.current = snapToGrid
  }, [snapToGrid])

  useEffect(() => {
    gridSizeRef.current = snapGridSize
  }, [snapGridSize])

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (leafletLoaded) {
        setIsLoading(false)
        return
      }

      try {
        // Import Leaflet CSS
        const leafletCSS = document.createElement("link")
        leafletCSS.rel = "stylesheet"
        leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(leafletCSS)

        // Import Leaflet JS
        const leafletModule = await import("leaflet")
        L = leafletModule.default

        // Fix default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        leafletLoaded = true
        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Failed to load Leaflet:", error)
        setIsLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return

    console.log("[v0] Initializing Leaflet map")

    const map = L.map(mapRef.current).setView(center, zoom)

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    // Handle map clicks
    map.on("click", (e: any) => {
      if (!editMode) return

      if (drawingMode === "circle") {
        onMapClick?.(e.latlng.lat, e.latlng.lng)
      } else if (drawingMode === "polygon") {
        handlePolygonClick(e.latlng.lat, e.latlng.lng)
      }
    })

    // Handle double click to finish polygon
    map.on("dblclick", (e: any) => {
      if (drawingMode === "polygon" && polygonPointsRef.current.length >= 3) {
        finishPolygon()
        L.DomEvent.preventDefault(e)
      }
    })

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  // Dependencies intentionally limited; handlers are stable across renders during edit sessions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletLoaded, center, zoom, editMode, drawingMode])

  const handlePolygonClick = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return

    const point: [number, number] = [lat, lng]
    polygonPointsRef.current.push(point)

    // Add temporary marker for the point
    const marker = L.circleMarker([lat, lng], {
      radius: 6,
      fillColor: "#3B82F6",
      color: "#1E40AF",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(mapInstanceRef.current)

    tempMarkersRef.current.push(marker)

    // Update drawing layer
    updateDrawingLayer()

    console.log("[v0] Polygon point added:", lat, lng, "Total points:", polygonPointsRef.current.length)
  }

  const updateDrawingLayer = () => {
    if (!mapInstanceRef.current) return

    // Remove existing drawing layer
    if (drawingLayerRef.current) {
      mapInstanceRef.current.removeLayer(drawingLayerRef.current)
    }

    const points = polygonPointsRef.current
    if (points.length < 2) return

    // Create polyline to show current drawing
    drawingLayerRef.current = L.polyline(points, {
      color: "#3B82F6",
      weight: 3,
      opacity: 0.8,
      dashArray: "5, 10",
    }).addTo(mapInstanceRef.current)
  }

  const finishPolygon = () => {
    if (polygonPointsRef.current.length < 3) return

    onPolygonComplete?.(polygonPointsRef.current)

    // Clear drawing state
    clearDrawingState()
  }

  const clearDrawingState = () => {
    // Clear temporary markers
    tempMarkersRef.current.forEach((marker) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker)
      }
    })
    tempMarkersRef.current = []

    // Clear drawing layer
    if (drawingLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(drawingLayerRef.current)
      drawingLayerRef.current = null
    }

    // Reset points
    polygonPointsRef.current = []
  }

  const enableZoneEditing = (
    zone: DeliveryZone,
    layer: any,
    geometry: CircleGeometry | PolygonGeometry,
  ) => {
    if (!mapInstanceRef.current) return

    if (zone.zone_type === "polygon" && geometry.type === "Polygon") {
      const latLngs = getPolygonLatLngs(geometry)
      layer.setLatLngs([latLngs])

      const polygonState = {
        zoneId: zone.id,
        type: "polygon" as const,
        layer,
        vertexMarkers: [] as any[],
        midpointMarkers: [] as any[],
      }

      const emitPolygonChange = () => {
        const updatedGeometry = buildPolygonGeometry(latLngs)
        const metrics = calculateGeometryMetrics(updatedGeometry)
        onGeometryChange?.(zone.id, updatedGeometry, metrics)
      }

      const refreshHandles = () => {
        polygonState.vertexMarkers.forEach((marker) => {
          mapInstanceRef.current.removeLayer(marker)
        })
        polygonState.midpointMarkers.forEach((marker) => {
          mapInstanceRef.current.removeLayer(marker)
        })

        polygonState.vertexMarkers = latLngs.map((_, index) => createVertexMarker(index))
        polygonState.midpointMarkers = latLngs
          .map((_, index) => createMidpointMarker(index))
          .filter((marker): marker is any => Boolean(marker))
      }

      const createVertexMarker = (index: number) => {
        const latlng = latLngs[index]
        const marker = L.marker(latlng, {
          draggable: true,
          icon: createHandleIcon("vertex"),
          autoPan: false,
        }).addTo(mapInstanceRef.current)

        marker.setZIndexOffset?.(1000)

        const updateMarkerLatLng = () => {
          let nextLatLng = marker.getLatLng()

          if (snapToGridRef.current) {
            const snapped = snapLatLngToGrid(nextLatLng.lat, nextLatLng.lng, gridSizeRef.current)
            nextLatLng = L.latLng(snapped.lat, snapped.lng)
            marker.setLatLng(nextLatLng)
          }

          latLngs[index] = nextLatLng
          layer.setLatLngs([latLngs])
        }

        const removeMarker = () => {
          if (latLngs.length <= 3) {
            return
          }

          latLngs.splice(index, 1)
          layer.setLatLngs([latLngs])
          emitPolygonChange()
          refreshHandles()
        }

        marker.on("drag", () => {
          updateMarkerLatLng()
        })

        marker.on("dragend", () => {
          updateMarkerLatLng()
          emitPolygonChange()
          refreshHandles()
        })

        marker.on("contextmenu", (event: any) => {
          event?.originalEvent?.preventDefault?.()
          removeMarker()
        })

        return marker
      }

      const createMidpointMarker = (index: number) => {
        if (latLngs.length < 2) return null

        const nextIndex = (index + 1) % latLngs.length
        const current = latLngs[index]
        const next = latLngs[nextIndex]

        if (!current || !next) return null

        const midpoint = L.latLng((current.lat + next.lat) / 2, (current.lng + next.lng) / 2)

        const marker = L.marker(midpoint, {
          icon: createHandleIcon("midpoint"),
          draggable: false,
          interactive: true,
        }).addTo(mapInstanceRef.current)

        marker.setZIndexOffset?.(900)

        const insertPoint = (latlng: any) => {
          const targetLatLng = (() => {
            if (!latlng) return marker.getLatLng()
            if (!snapToGridRef.current) return latlng
            const snapped = snapLatLngToGrid(latlng.lat, latlng.lng, gridSizeRef.current)
            return L.latLng(snapped.lat, snapped.lng)
          })()

          const newLatLng = L.latLng(targetLatLng.lat, targetLatLng.lng)
          latLngs.splice(nextIndex, 0, newLatLng)
          layer.setLatLngs([latLngs])
          emitPolygonChange()
          refreshHandles()
        }

        marker.on("click", (event: any) => {
          insertPoint(event?.latlng || marker.getLatLng())
        })

        return marker
      }

      editingStateRef.current = polygonState
      refreshHandles()
    } else if (zone.zone_type === "circle" && geometry.type === "Point") {
      const center = L.latLng(geometry.coordinates[1], geometry.coordinates[0])
      const radius = geometry.properties?.radius || layer.getRadius() || 1000

      layer.setLatLng(center)
      layer.setRadius(radius)

      const centerMarker = L.marker(center, {
        draggable: true,
        icon: createHandleIcon("center"),
        autoPan: false,
      }).addTo(mapInstanceRef.current)

      centerMarker.setZIndexOffset?.(1200)

      const initialBearing = 90
      const radiusPoint = destinationPoint(center.lat, center.lng, radius, initialBearing)

      const radiusMarker = L.marker([radiusPoint.lat, radiusPoint.lng], {
        draggable: true,
        icon: createHandleIcon("radius"),
        autoPan: false,
      }).addTo(mapInstanceRef.current)

      radiusMarker.setZIndexOffset?.(1200)

      const emitGeometryChange = () => {
        const updatedGeometry = buildCircleGeometry(layer.getLatLng(), layer.getRadius())
        const metrics = calculateGeometryMetrics(updatedGeometry)
        onGeometryChange?.(zone.id, updatedGeometry, metrics)
      }

      const updateCenter = () => {
        let nextLatLng = centerMarker.getLatLng()
        if (snapToGridRef.current) {
          const snapped = snapLatLngToGrid(nextLatLng.lat, nextLatLng.lng, gridSizeRef.current)
          nextLatLng = L.latLng(snapped.lat, snapped.lng)
          centerMarker.setLatLng(nextLatLng)
        }

        layer.setLatLng(nextLatLng)

        const bearing = bearingBetweenPoints(
          nextLatLng.lat,
          nextLatLng.lng,
          radiusMarker.getLatLng().lat,
          radiusMarker.getLatLng().lng,
        )
        const radiusPoint = destinationPoint(nextLatLng.lat, nextLatLng.lng, layer.getRadius(), bearing)
        radiusMarker.setLatLng([radiusPoint.lat, radiusPoint.lng])
      }

      const updateRadius = (emitSnap = false) => {
        const centerLatLng = centerMarker.getLatLng()
        const handleLatLng = radiusMarker.getLatLng()
        const map = mapInstanceRef.current
        let distance = map.distance(centerLatLng, handleLatLng)

        if (snapToGridRef.current) {
          distance = Math.max(10, snapDistanceToGrid(distance, gridSizeRef.current))
        }

        const bearing = bearingBetweenPoints(
          centerLatLng.lat,
          centerLatLng.lng,
          handleLatLng.lat,
          handleLatLng.lng,
        )

        const snappedPoint = destinationPoint(centerLatLng.lat, centerLatLng.lng, distance, bearing)
        radiusMarker.setLatLng([snappedPoint.lat, snappedPoint.lng])
        layer.setRadius(distance)
        if (emitSnap) {
          emitGeometryChange()
        }
      }

      centerMarker.on("drag", () => {
        updateCenter()
      })

      centerMarker.on("dragend", () => {
        updateCenter()
        emitGeometryChange()
      })

      radiusMarker.on("drag", () => {
        updateRadius(false)
      })

      radiusMarker.on("dragend", () => {
        updateRadius(true)
      })

      editingStateRef.current = {
        zoneId: zone.id,
        type: "circle",
        layer,
        centerMarker,
        radiusHandle: radiusMarker,
      }
    }
  }

  const disableZoneEditing = () => {
    if (!mapInstanceRef.current || !editingStateRef.current) return

    const { vertexMarkers, midpointMarkers, centerMarker, radiusHandle, layer } =
      editingStateRef.current

    vertexMarkers?.forEach((marker: any) => {
      mapInstanceRef.current.removeLayer(marker)
    })

    midpointMarkers?.forEach((marker: any) => {
      mapInstanceRef.current.removeLayer(marker)
    })

    if (centerMarker) {
      mapInstanceRef.current.removeLayer(centerMarker)
    }

    if (radiusHandle) {
      mapInstanceRef.current.removeLayer(radiusHandle)
    }

    if (layer) {
      mapInstanceRef.current.removeLayer(layer)
    }

    editingStateRef.current = null
  }

  // Clear drawing state when drawing mode changes
  useEffect(() => {
    if (drawingMode !== "polygon") {
      clearDrawingState()
    }
  }, [drawingMode])

  // Clear editing state when edit mode changes
  useEffect(() => {
    if (!editMode) {
      disableZoneEditing()
    }
  }, [editMode])

  useEffect(() => {
    if (!mapInstanceRef.current || !center || editMode) return

    const currentCenter = mapInstanceRef.current.getCenter()
    if (
      Math.abs(currentCenter.lat - center[0]) > 1e-6 ||
      Math.abs(currentCenter.lng - center[1]) > 1e-6
    ) {
      const currentZoom = mapInstanceRef.current.getZoom()
      mapInstanceRef.current.setView(center, currentZoom, { animate: false })
    }
  }, [center, editMode])

  // Update zones on map
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return

    const map = mapInstanceRef.current

    // Remove existing non-editing layers
    layersRef.current.forEach((layer) => {
      map.removeLayer(layer)
    })
    layersRef.current = []

    // Clear existing editing handles/layer before re-rendering
    if (editingStateRef.current) {
      disableZoneEditing()
    }

    zones.forEach((zone) => {
      if (!zone.is_active) return

      // Skip rendering persisted layer if this is the zone currently being edited
      if (editingZone && zone.id === editingZone.id) {
        return
      }

      const geometry = zone.geometry as CircleGeometry | PolygonGeometry
      const layer = createLayerForGeometry(zone, geometry)

      layer.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${zone.name}</h3>
          ${zone.description ? `<p class="text-xs text-gray-600 mt-1">${zone.description}</p>` : ""}
          <p class="text-xs font-medium mt-2">Delivery Fee: €${zone.delivery_fee}</p>
        </div>
      `)

      layer.on("click", (e: any) => {
        L.DomEvent.stopPropagation(e)
        onZoneClick?.(zone)
      })

      if (selectedZone && selectedZone.id === zone.id) {
        layer.setStyle({
          weight: 4,
          opacity: 1,
          fillOpacity: 0.5,
        })
        layer.bringToFront()
      }

      layer.addTo(map)
      layersRef.current.push(layer)
    })

    if (editingZone) {
      const baseGeometry = (draftGeometry ?? (editingZone.geometry as CircleGeometry | PolygonGeometry)) || null

      if (baseGeometry) {
        const layer = createLayerForGeometry(editingZone, baseGeometry, {
          weight: editMode ? 4 : 3,
          opacity: 1,
          fillOpacity: editMode ? 0.45 : 0.35,
          dashArray: editMode ? "6 4" : "3 6",
        })

        layer.on("click", (e: any) => {
          L.DomEvent.stopPropagation(e)
          onZoneClick?.(editingZone)
        })

        layer.addTo(map)
        layer.bringToFront()

        if (editMode) {
          enableZoneEditing(editingZone, layer, baseGeometry)
        } else {
          layersRef.current.push(layer)
        }
      }
    }
  }, [
    zones,
    selectedZone,
    editingZone,
    draftGeometry,
    editMode,
    leafletLoaded,
    onZoneClick,
    createLayerForGeometry,
    enableZoneEditing,
  ])

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={mapRef} className={className} />

      {drawingMode === "polygon" && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="font-medium text-sm">Drawing Polygon Zone</p>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Click to add points</p>
            <p>• Double-click to finish</p>
            <p>• Need at least 3 points</p>
            {polygonPointsRef.current.length > 0 && (
              <p className="text-blue-600 font-medium">Points: {polygonPointsRef.current.length}</p>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
