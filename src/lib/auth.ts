export function getTenantRestaurantId(req: Request) {
  // Prefer explicit header, then cookie
  const rid = req.headers.get('x-restaurant-id') || getCookie(req.headers.get('cookie') || '', 'restaurantId')
  return rid || null
}

export function assertTenantOrThrow(req: Request, resourceRestaurantId: string | null | undefined) {
  const tenant = getTenantRestaurantId(req)
  if (!tenant || !resourceRestaurantId) return { ok: false, reason: 'Missing tenant or resource restaurantId' }
  const match = String(resourceRestaurantId) === String(tenant)
  return { ok: match, reason: match ? undefined : 'Cross-tenant access denied' }
}

function getCookie(header: string, name: string): string | null {
  const parts = header.split(';')
  for (const p of parts) {
    const [k, v] = p.split('=')
    if (k && v && k.trim() === name) return decodeURIComponent(v.trim())
  }
  return null
}
