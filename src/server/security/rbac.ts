import type { UserRole } from '@/models/User'

const roleHierarchy: Record<UserRole, number> = {
  USER: 1,
  ADMIN: 5,
  SUPERADMIN: 10,
}

export const hasRequiredRole = (userRoles: UserRole[], required: UserRole[]) => {
  if (!required.length) return true
  const maxUserLevel = Math.max(...userRoles.map((role) => roleHierarchy[role] ?? 0))
  const minRequired = Math.min(...required.map((role) => roleHierarchy[role] ?? Infinity))
  return maxUserLevel >= minRequired
}

export const isSuperAdmin = (roles: UserRole[]) => roles.includes('SUPERADMIN')
