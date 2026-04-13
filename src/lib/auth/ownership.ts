export type RoleAssignment = { restaurantId?: string | null; role?: string }

export type TargetInfo = {
  type: "restaurant" | "supermarket"
  id: string
}

const normalizeRole = (role: any) =>
  String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

const isAdminRole = (value: any) => normalizeRole(value) === "meelza_admin"

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
  const hasOwnerRole = assignments.some((entry) => {
    if (!entry || entry.role !== "owner") return false
    const assignmentId = entry.restaurantId ? String(entry.restaurantId) : null
    if (!assignmentId) return true
    return assignmentId === target.id
  })

  if (hasOwnerRole) return true

  if (user.role === "owner") {
    const primaryId = user.restaurantId ? String(user.restaurantId) : null
    return !primaryId || primaryId === target.id
  }

  return false
}
