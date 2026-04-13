import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { pointInPolygon } from "../src/lib/geo/point-in-polygon.js"
import type { IGeoJSONPolygon } from "../src/types/delivery-zone.js"

describe("pointInPolygon", () => {
  const square: IGeoJSONPolygon = {
    type: "Polygon",
    coordinates: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]],
  }

  it("returns true for a point inside the polygon", () => {
    const result = pointInPolygon({ lat: 2, lng: 2 }, square)
    assert.equal(result, true)
  })

  it("returns true for a point on the edge of the polygon", () => {
    const result = pointInPolygon({ lat: 0, lng: 2 }, square)
    assert.equal(result, true)
  })

  it("returns false for a point outside the polygon", () => {
    const result = pointInPolygon({ lat: 5, lng: 5 }, square)
    assert.equal(result, false)
  })

  it("returns false for points inside a hole", () => {
    const polygonWithHole: IGeoJSONPolygon = {
      type: "Polygon",
      coordinates: [
        [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
        [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]],
      ],
    }

    const result = pointInPolygon({ lat: 5, lng: 5 }, polygonWithHole)
    assert.equal(result, false)
  })

  it("returns false when polygon is invalid", () => {
    const result = pointInPolygon({ lat: 1, lng: 1 }, null)
    assert.equal(result, false)
  })
})
