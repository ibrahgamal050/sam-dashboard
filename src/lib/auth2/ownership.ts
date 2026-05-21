export type RoleAssignment = {
  restaurantId?: string | null
  supermarketId?: string | null
  brandId?: string | null
  role?: string
}

export type TargetInfo = {
  type: "restaurant" | "supermarket" | "brand"
  id: string
  brandId?: string | null
}

const normalizeRole = (role: any) =>
  String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

const isAdminRole = (value: any) => ["meelza_admin", "admin", "superadmin"].includes(normalizeRole(value))

export const isOwnerForTarget = (user: any, target: TargetInfo) => {
  if (!user) return false
  const rawRoles = Array.isArray(user.roles)
    ? user.roles
    : typeof (user as any).roles === "string"
      ? [(user as any).roles]
      : Array.isArray((user as any).roleAssignments)
        ? (user as any).roleAssignments
        : []

  const realmRoles = Array.isArray((user as any)?.realm_access?.roles)
    ? ((user as any).realm_access.roles as any[])
    : []

  const hasAdminRole =
    isAdminRole(user.role) ||
    rawRoles.some((entry: any) => {
      if (!entry) return false
      if (typeof entry === "string") return isAdminRole(entry)
      return isAdminRole(entry.role) || isAdminRole(entry.name)
    }) ||
    realmRoles.some((entry) => isAdminRole(entry))

  if (hasAdminRole) return true

  const assignments = rawRoles as RoleAssignment[]
  const normalizedBrandId = target.brandId ? String(target.brandId) : null
  const hasOwnerRole = assignments.some((entry) => {
    if (!entry || normalizeRole(entry.role) !== "owner") return false

    const restaurantId = entry.restaurantId ? String(entry.restaurantId) : null
    const supermarketId = entry.supermarketId ? String(entry.supermarketId) : null
    const brandId = entry.brandId ? String(entry.brandId) : null

    if (target.type === "restaurant" && restaurantId) {
      return restaurantId === target.id
    }

    if (target.type === "supermarket" && supermarketId) {
      return supermarketId === target.id
    }

    if (target.type === "brand" && brandId) {
      return brandId === target.id
    }

    if (brandId && normalizedBrandId) {
      return brandId === normalizedBrandId
    }

    return false
  })

  if (hasOwnerRole) return true

  if (user.role === "owner") {
    if (target.type === "restaurant") {
      const primaryRestaurantId = user.restaurantId ? String(user.restaurantId) : null
      if (primaryRestaurantId) return primaryRestaurantId === target.id
    }

    if (target.type === "supermarket") {
      const primarySupermarketId = user.supermarketId ? String(user.supermarketId) : null
      if (primarySupermarketId) return primarySupermarketId === target.id
    }

    if (target.type === "brand" && user.brandId) {
      return String(user.brandId) === target.id
    }

    if (user.brandId && normalizedBrandId) {
      return String(user.brandId) === normalizedBrandId
    }

    return false
  }

  return false
}
