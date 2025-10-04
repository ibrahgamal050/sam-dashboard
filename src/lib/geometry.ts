import type { CircleGeometry, PolygonGeometry } from "@/types/delivery-zones"

const EARTH_RADIUS_METERS = 6378137

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

export interface GeometryMetrics {
  area: number
  perimeter: number
  vertexCount?: number
  radius?: number
}

// Project lat/lng to meters using Web Mercator projection
export const projectLatLngToMeters = (lat: number, lng: number) => {
  const x = toRadians(lng) * EARTH_RADIUS_METERS
  const y = Math.log(Math.tan(Math.PI / 4 + toRadians(lat) / 2)) * EARTH_RADIUS_METERS
  return { x, y }
}

// Convert projected meters back to lat/lng
export const unprojectMetersToLatLng = (x: number, y: number) => {
  const lng = toDegrees(x / EARTH_RADIUS_METERS)
  const lat = toDegrees(2 * Math.atan(Math.exp(y / EARTH_RADIUS_METERS)) - Math.PI / 2)
  return { lat, lng }
}

export const haversineDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

export const snapLatLngToGrid = (lat: number, lng: number, gridSizeMeters: number) => {
  const { x, y } = projectLatLngToMeters(lat, lng)
  const snappedX = Math.round(x / gridSizeMeters) * gridSizeMeters
  const snappedY = Math.round(y / gridSizeMeters) * gridSizeMeters
  return unprojectMetersToLatLng(snappedX, snappedY)
}

export const snapDistanceToGrid = (distance: number, gridSizeMeters: number) => {
  return Math.round(distance / gridSizeMeters) * gridSizeMeters
}

export const calculatePolygonMetrics = (geometry: PolygonGeometry): GeometryMetrics => {
  const coordinates = geometry.coordinates?.[0]
  if (!coordinates || coordinates.length < 3) {
    return { area: 0, perimeter: 0, vertexCount: coordinates?.length }
  }

  // Shoelace formula on projected coordinates
  const projected = coordinates.map(([lng, lat]) => projectLatLngToMeters(lat, lng))
  let area = 0
  for (let i = 0; i < projected.length - 1; i++) {
    const { x: x1, y: y1 } = projected[i]
    const { x: x2, y: y2 } = projected[i + 1]
    area += x1 * y2 - x2 * y1
  }
  area = Math.abs(area) / 2

  // Perimeter via haversine
  let perimeter = 0
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i]
    const [lng2, lat2] = coordinates[i + 1]
    perimeter += haversineDistanceMeters(lat1, lng1, lat2, lng2)
  }

  return {
    area,
    perimeter,
    vertexCount: coordinates.length - 1, // last point duplicates first
  }
}

export const calculateCircleMetrics = (geometry: CircleGeometry): GeometryMetrics => {
  const radius = geometry.properties?.radius || 0
  const area = Math.PI * radius * radius
  const perimeter = 2 * Math.PI * radius

  return {
    area,
    perimeter,
    radius,
  }
}

export const calculateGeometryMetrics = (geometry: CircleGeometry | PolygonGeometry): GeometryMetrics => {
  if (geometry.type === "Polygon") {
    return calculatePolygonMetrics(geometry as PolygonGeometry)
  }
  return calculateCircleMetrics(geometry as CircleGeometry)
}

export const formatArea = (area: number) => {
  if (!area || area <= 0) return "0 m²"
  if (area >= 1_000_000) {
    return `${(area / 1_000_000).toFixed(2)} km²`
  }
  return `${Math.round(area).toLocaleString()} m²`
}

export const formatDistance = (distance: number) => {
  if (!distance || distance <= 0) return "0 m"
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(2)} km`
  }
  return `${Math.round(distance).toLocaleString()} m`
}

export const destinationPoint = (lat: number, lng: number, distanceMeters: number, bearingDegrees: number) => {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS
  const bearing = toRadians(bearingDegrees)
  const latRad = toRadians(lat)
  const lngRad = toRadians(lng)

  const destLat = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing),
  )

  const destLng =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLat),
    )

  return { lat: toDegrees(destLat), lng: ((toDegrees(destLng) + 540) % 360) - 180 }
}

export const bearingBetweenPoints = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLng = toRadians(lng2 - lng1)
  const y = Math.sin(dLng) * Math.cos(toRadians(lat2))
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLng)
  const brng = (toDegrees(Math.atan2(y, x)) + 360) % 360
  return brng
}

export const geometryEquals = (a: CircleGeometry | PolygonGeometry | null, b: CircleGeometry | PolygonGeometry | null) => {
  if (!a || !b || a.type !== b.type) return false
  if (a.type === "Point") {
    const circleA = a as CircleGeometry
    const circleB = b as CircleGeometry
    return (
      Math.abs(circleA.coordinates[0] - circleB.coordinates[0]) < 1e-8 &&
      Math.abs(circleA.coordinates[1] - circleB.coordinates[1]) < 1e-8 &&
      Math.abs((circleA.properties?.radius || 0) - (circleB.properties?.radius || 0)) < 1e-4
    )
  }

  const polyA = a as PolygonGeometry
  const polyB = b as PolygonGeometry
  const coordsA = polyA.coordinates?.[0] || []
  const coordsB = polyB.coordinates?.[0] || []

  if (coordsA.length !== coordsB.length) return false

  for (let i = 0; i < coordsA.length; i++) {
    const [lngA, latA] = coordsA[i]
    const [lngB, latB] = coordsB[i]
    if (Math.abs(lngA - lngB) >= 1e-8 || Math.abs(latA - latB) >= 1e-8) {
      return false
    }
  }

  return true
}

export const cloneGeometry = <T extends CircleGeometry | PolygonGeometry>(geometry: T): T => {
  return JSON.parse(JSON.stringify(geometry))
}

export const getGeometryCenter = (
  geometry: CircleGeometry | PolygonGeometry | null | undefined,
): { lat: number; lng: number } | null => {
  if (!geometry) return null

  if (geometry.type === "Point") {
    const circle = geometry as CircleGeometry
    const [lng, lat] = circle.coordinates
    return { lat, lng }
  }

  if (geometry.type === "Polygon") {
    const polygon = geometry as PolygonGeometry
    const ring = polygon.coordinates?.[0]
    if (!ring || ring.length === 0) return null

    let areaAccumulator = 0
    let centroidX = 0
    let centroidY = 0

    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i]
      const [x2, y2] = ring[i + 1]
      const cross = x1 * y2 - x2 * y1
      areaAccumulator += cross
      centroidX += (x1 + x2) * cross
      centroidY += (y1 + y2) * cross
    }

    const area = areaAccumulator / 2

    if (Math.abs(area) < 1e-12) {
      // Degenerate polygon; fall back to arithmetic mean of vertices
      const filtered = ring.slice(0, ring.length - 1)
      const sum = filtered.reduce(
        (acc, [lng, lat]) => {
          acc.lng += lng
          acc.lat += lat
          return acc
        },
        { lat: 0, lng: 0 },
      )

      const count = filtered.length || ring.length
      return {
        lat: sum.lat / count,
        lng: sum.lng / count,
      }
    }

    return {
      lat: centroidY / (6 * area),
      lng: centroidX / (6 * area),
    }
  }

  return null
}
