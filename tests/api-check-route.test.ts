import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mock } from "node:test"

type ResolveResult = {
  inside: boolean
  zone?: {
    id: string
    name: string
    fee: number
    minOrder: number
  }
}

let resolveBehavior: ((restaurantId: string, lat: number, lng: number) => Promise<ResolveResult>) | null = null
const dbConnectMock = mock.fn(async () => {})

let POST: ((request: Request) => Promise<Response>) | null = null
let internals: typeof import("../src/app/api/delivery-zones/check/route.js").deliveryZoneCheckInternals | null = null

before(async () => {
  const module = await import("../src/app/api/delivery-zones/check/route.js")
  POST = module.POST
  internals = module.deliveryZoneCheckInternals
  internals.dbConnect = async () => {
    await dbConnectMock()
  }
  internals.resolveDeliveryZone = async (restaurantId: string, lat: number, lng: number) => {
    if (!resolveBehavior) {
      throw new Error("resolveBehavior not configured")
    }
    return resolveBehavior(restaurantId, lat, lng)
  }
})

after(() => {
  mock.restoreAll()
})

describe("/api/delivery-zones/check", () => {
  it("returns zone details when point is inside", async () => {
    dbConnectMock.mock.resetCalls()
    resolveBehavior = async () => ({
      inside: true,
      zone: { id: "zone1", name: "Zone A", fee: 10, minOrder: 50 },
    })

    const req = new Request("http://localhost/api/delivery-zones/check", {
      method: "POST",
      body: JSON.stringify({ restaurantId: "rest1", lat: 24.1, lng: 54.3 }),
      headers: { "content-type": "application/json" },
    })

    const response = await POST!(req)
    const json = await response.json()

    assert.equal(response.status, 200)
    assert.deepEqual(json, {
      inside: true,
      zone: { id: "zone1", name: "Zone A", fee: 10, minOrder: 50 },
    })
    assert.equal(dbConnectMock.mock.callCount(), 1)
  })

  it("returns outside when no zone matches", async () => {
    dbConnectMock.mock.resetCalls()
    resolveBehavior = async () => ({ inside: false })

    const req = new Request("http://localhost/api/delivery-zones/check", {
      method: "POST",
      body: JSON.stringify({ restaurantId: "rest1", lat: 45, lng: 130 }),
      headers: { "content-type": "application/json" },
    })

    const response = await POST!(req)
    const json = await response.json()

    assert.equal(response.status, 200)
    assert.deepEqual(json, { inside: false })
  })
})
