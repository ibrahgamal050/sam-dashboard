import type { DefaultSession, DefaultUser } from "next-auth"

type MeelzaRole = "meelza_admin" | "owner" | "staff"
type MeelzaRoleAssignment = { restaurantId: string | null; role: MeelzaRole }

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string
      meelzaRole?: MeelzaRole
      restaurantId?: string | null
      roles?: Array<"USER" | "ADMIN" | "SUPERADMIN">
      roleAssignments?: MeelzaRoleAssignment[]
    }
  }

  interface User extends DefaultUser {
    role?: MeelzaRole
    restaurantId?: string | null
    roleAssignments?: MeelzaRoleAssignment[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    meelzaRole?: MeelzaRole
    restaurantId?: string | null
    roles?: Array<"USER" | "ADMIN" | "SUPERADMIN">
    roleAssignments?: MeelzaRoleAssignment[]
  }
}
