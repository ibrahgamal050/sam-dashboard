export const MENU_TYPES = ["delivery", "dinein", "takeaway"] as const

export type MenuType = (typeof MENU_TYPES)[number]

export const normalizeMenuType = (value?: string | null): MenuType | null => {
  if (!value) return "delivery"
  const normalized = value.trim().toLowerCase()
  return MENU_TYPES.includes(normalized as MenuType) ? (normalized as MenuType) : null
}
