import type { PolygonGeometry } from "@/types/delivery-zones"
import difference from "@turf/difference"
import area from "@turf/area"
import { polygon as turfPolygon, type Feature } from "@turf/helpers"
import booleanIntersects from "@turf/boolean-intersects"
import booleanContains from "@turf/boolean-contains"

const MIN_AREA_THRESHOLD = 1e-6

const polygonGeometryToFeature = (geometry: PolygonGeometry): Feature => {
  return turfPolygon(geometry.coordinates as any)
}

const hasSufficientPoints = (geometry: PolygonGeometry) => {
  const ring = geometry.coordinates?.[0]
  return Array.isArray(ring) && ring.length >= 4
}

const hasSufficientFeatureArea = (feature: Feature | null) => {
  if (!feature || !feature.geometry) return false
  const geom = feature.geometry

  if (geom.type === "Polygon") {
    const ring = geom.coordinates?.[0]
    if (!Array.isArray(ring) || ring.length < 4) return false
  }

  const computedArea = area(feature as any)
  return computedArea > MIN_AREA_THRESHOLD
}

const attemptDifference = (
  subject: Feature,
  clip: Feature,
): { feature: Feature | null; error: Error | null } => {
  try {
    const diffResult = difference(subject as any, clip as any)
    return { feature: diffResult as Feature | null, error: null }
  } catch (error) {
    console.error("[zone-topology] difference failed", error)
    return { feature: null, error: error as Error }
  }
}

const featureToPolygonGeometry = (feature: Feature | null): PolygonGeometry | null => {
  if (!feature || !feature.geometry) return null

  if (feature.geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: (feature.geometry.coordinates as number[][][]) || [],
    }
  }

  if (feature.geometry.type === "MultiPolygon") {
    let best: { coords: number[][][]; area: number } | null = null

    feature.geometry.coordinates.forEach((coords) => {
      const poly = turfPolygon(coords as any)
      const polyArea = area(poly)
      if (!best || polyArea > best.area) {
        best = { coords: coords as number[][][], area: polyArea }
      }
    })

    if (best) {
      return {
        type: "Polygon",
        coordinates: best.coords,
      }
    }
  }

  return null
}

export const subtractPolygonOverlaps = (
  target: PolygonGeometry,
  blockers: PolygonGeometry[],
): PolygonGeometry => {
  if (!blockers.length || !hasSufficientPoints(target)) {
    return target
  }

  let resultFeature: Feature | null = polygonGeometryToFeature(target)

  if (!hasSufficientFeatureArea(resultFeature)) {
    return target
  }

  for (const blocker of blockers) {
    if (!hasSufficientPoints(blocker)) {
      continue
    }

    const blockerFeature = polygonGeometryToFeature(blocker)

    if (!hasSufficientFeatureArea(blockerFeature)) {
      continue
    }

    if (!resultFeature) {
      break
    }

    const hasIntersection =
      booleanIntersects(resultFeature as any, blockerFeature as any) ||
      booleanContains(blockerFeature as any, resultFeature as any) ||
      booleanContains(resultFeature as any, blockerFeature as any)

    if (!hasIntersection) {
      continue
    }

    const { feature: diff, error } = attemptDifference(resultFeature as Feature, blockerFeature)

    if (error) {
      // If difference fails, keep original to avoid runtime crash.
      continue
    }

    if (!diff) {
      // Fully overlapped; return a minimal geometry to avoid null downstream
      return target
    }

    resultFeature = diff as Feature

    if (!hasSufficientFeatureArea(resultFeature)) {
      return target
    }
  }

  const sanitized = featureToPolygonGeometry(resultFeature)
  return sanitized ?? target
}
