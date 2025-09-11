export const STATION_MAP: Record<string, string> = {
  grill: 'grill',
  fry: 'fry',
  dessert: 'dessert',
  drinks: 'drinks',
}

export type MenuItem = { name: string; qty: number; tags?: string[] }

export function computeRoutesForItem(item: MenuItem): string[] {
  const tags = (item.tags || []).map((t) => t.toLowerCase())
  const routes = new Set<string>()
  for (const t of tags) {
    if (STATION_MAP[t]) routes.add(STATION_MAP[t])
    if (t.includes('grill')) routes.add('grill')
    if (t.includes('fried') || t.includes('fry')) routes.add('fry')
    if (t.includes('dessert') || t.includes('sweet')) routes.add('dessert')
    if (t.includes('drink') || t.includes('beverage')) routes.add('drinks')
  }
  return Array.from(routes)
}

