import type { IGeoJSONPolygon } from "@/types/delivery-zone"

type LngLat = [number, number]

type Point = {
  lng: number
  lat: number
}

function isPointOnSegment(point: Point, [ax, ay]: LngLat, [bx, by]: LngLat) {
  const epsilon = 1e-10
  const { lng: px, lat: py } = point
  const cross = (py - ay) * (bx - ax) - (px - ax) * (by - ay)
  if (Math.abs(cross) > epsilon) return false

  const minX = Math.min(ax, bx) - epsilon
  const maxX = Math.max(ax, bx) + epsilon
  const minY = Math.min(ay, by) - epsilon
  const maxY = Math.max(ay, by) + epsilon
  return px >= minX && px <= maxX && py >= minY && py <= maxY
}

function ringContains(point: Point, ring: LngLat[]): boolean {
  if (!Array.isArray(ring) || ring.length < 3) return false

  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const current = ring[i]
    const prev = ring[j]
    if (!current || !prev) continue

    if (isPointOnSegment(point, prev, current)) {
      return true
    }

    const xi = current[0]
    const yi = current[1]
    const xj = prev[0]
    const yj = prev[1]

    const intersects = yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

export function pointInPolygon(point: Point, polygon: IGeoJSONPolygon | null | undefined): boolean {
  if (!polygon || polygon.type !== "Polygon" || !Array.isArray(polygon.coordinates)) {
    return false
  }

  const [outerRing, ...holes] = polygon.coordinates
  if (!ringContains(point, normalizeRing(outerRing))) {
    return false
  }

  for (const hole of holes) {
    if (ringContains(point, normalizeRing(hole))) {
      return false
    }
  }

  return true
}

function normalizeRing(ring: number[][] | undefined): LngLat[] {
  if (!ring || ring.length === 0) return []
  const normalized = ring.map((coord) => [coord[0], coord[1]] as LngLat)
  const first = normalized[0]
  const last = normalized[normalized.length - 1]
  const isClosed = first && last && first[0] === last[0] && first[1] === last[1]
  if (isClosed) {
    return normalized
  }
  if (!first) {
    return []
  }
  return [...normalized, [first[0], first[1]]]
}
