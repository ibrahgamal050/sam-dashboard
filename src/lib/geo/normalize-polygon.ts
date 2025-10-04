export function closePolygonRings(coordinates: number[][][]): number[][][] {
  if (!Array.isArray(coordinates)) return []
  return coordinates.map((ring) => {
    if (!Array.isArray(ring) || ring.length === 0) {
      return Array.isArray(ring) ? ring : []
    }
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first && last && first[0] === last[0] && first[1] === last[1]) {
      return ring
    }
    return [...ring, [first[0], first[1]]]
  })
}
