"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import mapboxgl from "mapbox-gl"
import MapboxDraw from "@mapbox/mapbox-gl-draw"

import type { DeliveryZoneDTO, IGeoJSONPolygon } from "@/types/delivery-zone"

const DEFAULT_CENTER: [number, number] = [46.6753, 24.7136]

export interface DeliveryZoneMapHandle {
  startDrawingPolygon: () => void
  loadZoneForEditing: (zone: DeliveryZoneDTO) => void
  clearDraft: () => void
  flyToZone: (zone: DeliveryZoneDTO) => void
}

type DeliveryZoneMapProps = {
  mapboxToken?: string
  zones: DeliveryZoneDTO[]
  selectedZoneId?: string | null
  onPolygonCreated?: (geometry: IGeoJSONPolygon) => void
  onPolygonUpdated?: (geometry: IGeoJSONPolygon) => void
  onZoneClick?: (zoneId: string) => void
}

type Feature = GeoJSON.Feature<IGeoJSONPolygon & { id?: string }>

export const DeliveryZoneMap = forwardRef<DeliveryZoneMapHandle, DeliveryZoneMapProps>(function DeliveryZoneMap(
  { mapboxToken, zones, selectedZoneId, onPolygonCreated, onPolygonUpdated, onZoneClick },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const draftFeatureIdRef = useRef<string | null>(null)
  const editingFeatureIdRef = useRef<string | null>(null)
  const modeRef = useRef<"idle" | "create" | "edit">("idle")
  const pendingActionRef = useRef<(() => void) | null>(null)

  useImperativeHandle(ref, () => ({
    startDrawingPolygon() {
      const execute = () => {
        if (!drawRef.current) return false
        clearDraft()
        modeRef.current = "create"
        drawRef.current.changeMode("draw_polygon")
        return true
      }
      if (!execute()) {
        pendingActionRef.current = execute
      }
    },
    loadZoneForEditing(zone: DeliveryZoneDTO) {
      const execute = () => {
        if (!drawRef.current || !mapRef.current) return false
        clearDraft()
        modeRef.current = "edit"
        const ids = drawRef.current.add({
          type: "Feature",
          geometry: zone.geometry,
          properties: { zoneId: zone.id },
        })
        if (Array.isArray(ids) && ids[0]) {
          editingFeatureIdRef.current = String(ids[0])
          drawRef.current.changeMode("simple_select", { featureIds: [ids[0]] })
          onPolygonCreated?.(zone.geometry)
          flyTo(boundsOf(zone.geometry))
        }
        return true
      }
      if (!execute()) {
        pendingActionRef.current = execute
      }
    },
    clearDraft() {
      clearDraft()
    },
    flyToZone(zone: DeliveryZoneDTO) {
      flyTo(boundsOf(zone.geometry))
    },
  }))

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!mapboxToken) return

    mapboxgl.accessToken = mapboxToken
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: 11,
    })

    map.addControl(new mapboxgl.NavigationControl(), "top-right")
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { trash: true },
      defaultMode: "simple_select",
    })

    map.addControl(draw, "top-left")

    map.on("load", () => {
      map.addSource("delivery-zones", {
        type: "geojson",
        data: featureCollection([]),
      })

      map.addLayer({
        id: "delivery-zones-fill",
        type: "fill",
        source: "delivery-zones",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "id"], selectedZoneId ?? ""],
            "#38bdf8",
            "#0EA5E9",
          ],
          "fill-opacity": 0.2,
        },
      })

      map.addLayer({
        id: "delivery-zones-outline",
        type: "line",
        source: "delivery-zones",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "id"], selectedZoneId ?? ""],
            "#0284C7",
            "#0F172A",
          ],
          "line-width": 2,
        },
      })

      updateZonesLayer()

      if (pendingActionRef.current) {
        const run = pendingActionRef.current
        pendingActionRef.current = null
        run()
      }
    })

    map.on("click", "delivery-zones-fill", (event) => {
      const feature = event.features?.[0]
      const zoneId = feature?.properties?.id
      if (typeof zoneId === "string") {
        onZoneClick?.(zoneId)
      }
    })

    map.on("mouseenter", "delivery-zones-fill", () => {
      map.getCanvas().style.cursor = "pointer"
    })

    map.on("mouseleave", "delivery-zones-fill", () => {
      map.getCanvas().style.cursor = ""
    })

    map.on("draw.create", (event) => {
      const feature = event.features?.[0]
      if (!feature || feature.geometry.type !== "Polygon") return
      draftFeatureIdRef.current = String(feature.id)
      onPolygonCreated?.(feature.geometry as IGeoJSONPolygon)
      modeRef.current = modeRef.current === "edit" ? "edit" : "create"
    })

    map.on("draw.update", (event) => {
      const feature = event.features?.[0]
      if (!feature || feature.geometry.type !== "Polygon") return
      onPolygonUpdated?.(feature.geometry as IGeoJSONPolygon)
    })

    map.on("draw.delete", () => {
      draftFeatureIdRef.current = null
      editingFeatureIdRef.current = null
      modeRef.current = "idle"
    })

    mapRef.current = map
    drawRef.current = draw
    if (pendingActionRef.current) {
      const run = pendingActionRef.current
      pendingActionRef.current = null
      run()
    }

    return () => {
      map.remove()
      mapRef.current = null
      drawRef.current = null
    }
  }, [mapboxToken, onPolygonCreated, onPolygonUpdated, onZoneClick, selectedZoneId])

  useEffect(() => {
    updateZonesLayer()
    const map = mapRef.current
    if (!map || !map.isStyleLoaded?.()) return

    if (map.getLayer("delivery-zones-fill")) {
      map.setPaintProperty("delivery-zones-fill", "fill-color", [
        "case",
        ["==", ["get", "id"], selectedZoneId ?? ""],
        "#38bdf8",
        "#0EA5E9",
      ])
    }
    if (map.getLayer("delivery-zones-outline")) {
      map.setPaintProperty("delivery-zones-outline", "line-color", [
        "case",
        ["==", ["get", "id"], selectedZoneId ?? ""],
        "#0284C7",
        "#0F172A",
      ])
    }
  }, [zones, selectedZoneId])

  const updateZonesLayer = () => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    const source = map.getSource("delivery-zones") as mapboxgl.GeoJSONSource | undefined
    if (!source) return
    const data = featureCollection(
      zones.map((zone) => ({
        type: "Feature",
        geometry: zone.geometry,
        properties: { id: zone.id, name: zone.name },
      })),
    )
    source.setData(data)
  }

  const clearDraft = () => {
    const draw = drawRef.current
    if (!draw) return
    const features = draw.getAll().features
    features.forEach((feature) => {
      if (feature.id) {
        draw.delete(String(feature.id))
      }
    })
    draftFeatureIdRef.current = null
    editingFeatureIdRef.current = null
    modeRef.current = "idle"
  }

  const flyTo = (bounds: mapboxgl.LngLatBoundsLike | null) => {
    const map = mapRef.current
    if (!map) return
    if (bounds) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 16 })
    }
  }

  return <div ref={containerRef} className="h-[500px] w-full overflow-hidden rounded-lg border" />
})

function featureCollection(features: Feature[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features as GeoJSON.Feature[],
  }
}

function boundsOf(geometry: IGeoJSONPolygon | null): mapboxgl.LngLatBoundsLike | null {
  if (!geometry || geometry.type !== "Polygon") return null
  const bounds = new mapboxgl.LngLatBounds()
  geometry.coordinates[0]?.forEach((coord) => {
    bounds.extend(coord as [number, number])
  })
  if (!bounds.isEmpty()) return bounds
  return null
}
