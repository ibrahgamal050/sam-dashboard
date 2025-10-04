import type { PolygonGeometry } from "@/types/delivery-zones"
import difference from "@turf/difference"
import area from "@turf/area"
import { polygon as turfPolygon, featureCollection } from "@turf/helpers"
import booleanIntersects from "@turf/boolean-intersects"
import booleanContains from "@turf/boolean-contains"
import type { Feature as TurfFeature, Polygon as GeoJSONPolygon, MultiPolygon } from "geojson"

const MIN_AREA_THRESHOLD = 1e-6

type PolygonFeature = TurfFeature<GeoJSONPolygon | MultiPolygon>

const polygonGeometryToFeature = (geometry: PolygonGeometry): PolygonFeature => {
  return turfPolygon(geometry.coordinates as any) as PolygonFeature
}

const hasSufficientPoints = (geometry: PolygonGeometry) => {
  const ring = geometry.coordinates?.[0]
  return Array.isArray(ring) && ring.length >= 4
}

const hasSufficientFeatureArea = (feature: PolygonFeature | null) => {
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
  subject: PolygonFeature,
  clip: PolygonFeature,
): { feature: PolygonFeature | null; error: Error | null } => {
  try {
    const diffResult = difference(featureCollection([subject as any, clip as any]))
    return { feature: diffResult as PolygonFeature | null, error: null }
  } catch (error) {
    console.error("[zone-topology] difference failed", error)
    return { feature: null, error: error as Error }
  }
}

const featureToPolygonGeometry = (feature: PolygonFeature | null): PolygonGeometry | null => {
  if (!feature || !feature.geometry) return null

  if (feature.geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: (feature.geometry.coordinates as number[][][]) || [],
    }
  }

  if (feature.geometry.type === "MultiPolygon") {
    let bestCoords: number[][][] | null = null
    let bestArea = 0

    feature.geometry.coordinates.forEach((coords) => {
      const poly = turfPolygon(coords as any)
      const polyArea = area(poly)
      if (!bestCoords || polyArea > bestArea) {
        bestCoords = coords as number[][][]
        bestArea = polyArea
      }
    })

    if (bestCoords) {
      return {
        type: "Polygon",
        coordinates: bestCoords,
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

  let resultFeature: PolygonFeature | null = polygonGeometryToFeature(target)

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

    const { feature: diff, error } = attemptDifference(resultFeature as PolygonFeature, blockerFeature)

    if (error) {
      // If difference fails, keep original to avoid runtime crash.
      continue
    }

    if (!diff) {
      // Fully overlapped; return a minimal geometry to avoid null downstream
      return target
    }

    resultFeature = diff as PolygonFeature

    if (!hasSufficientFeatureArea(resultFeature)) {
      return target
    }
  }

  const sanitized = featureToPolygonGeometry(resultFeature)
  return sanitized ?? target
}
