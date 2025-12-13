import type { NextAuthOptions } from "next-auth"
import type { OAuthConfig } from "next-auth/providers/oauth"

type MeelzaRole = "meelza_admin" | "owner" | "staff"
type RoleAssignmentPayload = { restaurantId?: string | null; role?: MeelzaRole }

const normalizeAssignments = (input: unknown): Array<{ restaurantId: string | null; role: MeelzaRole }> => {
  if (!Array.isArray(input)) return []
  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const role = (entry as RoleAssignmentPayload).role
      if (!role) return null
      const restaurantId = (entry as RoleAssignmentPayload).restaurantId ?? null
      return { role, restaurantId }
    })
    .filter((entry): entry is { restaurantId: string | null; role: MeelzaRole } => Boolean(entry?.role))
}

const pickPrimaryAssignment = (
  assignments: Array<{ restaurantId: string | null; role: MeelzaRole }>,
): { restaurantId: string | null; role: MeelzaRole } | undefined => {
  if (!assignments.length) return undefined
  return assignments.find((assignment) => assignment.restaurantId == null) ?? assignments[0]
}

const MEELZA_ID_ISSUER = process.env.MEELZA_ID_ISSUER || "http://localhost:3004"
const MEELZA_ID_CLIENT_ID = process.env.MEELZA_ID_CLIENT_ID
const MEELZA_ID_CLIENT_SECRET = process.env.MEELZA_ID_CLIENT_SECRET

if (!MEELZA_ID_CLIENT_ID || !MEELZA_ID_CLIENT_SECRET) {
  throw new Error("Missing MEELZA_ID_CLIENT_ID or MEELZA_ID_CLIENT_SECRET environment variables")
}

function mapRoleToDashboardRoles(role: MeelzaRole | undefined): Array<"USER" | "ADMIN" | "SUPERADMIN"> {
  switch (role) {
    case "meelza_admin":
      return ["SUPERADMIN"]
    case "owner":
      return ["ADMIN"]
    default:
      return ["USER"]
  }
}

const scope = "openid profile email"

const MeelzaIdProvider: OAuthConfig<Record<string, unknown>> = {
  id: "meelza-id",
  name: "Meelza ID",
  type: "oauth",
  authorization: {
    url: `${MEELZA_ID_ISSUER}/oauth/authorize`,
    params: { scope },
  },
  token: `${MEELZA_ID_ISSUER}/oauth/token`,
  userinfo: `${MEELZA_ID_ISSUER}/api/userinfo`,
  clientId: MEELZA_ID_CLIENT_ID,
  clientSecret: MEELZA_ID_CLIENT_SECRET,
  checks: ["pkce", "state"],
  idToken: false,
  profile(profile) {
    const assignments = normalizeAssignments((profile as any).roles)
    const primary = pickPrimaryAssignment(assignments)
    const restaurantId = primary?.restaurantId ?? null
    return {
      id: profile.sub as string,
      name: profile.name ?? profile.email ?? "Meelza User",
      email: profile.email,
      image: profile.picture,
      roleAssignments: assignments,
      role: primary?.role,
      restaurantId,
    }
  },
}

export const authOptions: NextAuthOptions = {
  providers: [MeelzaIdProvider],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      const assignments = normalizeAssignments((user as any).roleAssignments)
      if (!assignments.length) {
        return "/auth/signin?error=missingRole"
      }
      ;(user as any).roleAssignments = assignments
      return true
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        const assignments = normalizeAssignments((user as any).roleAssignments)
        if (!assignments.length) {
          throw new Error("missingRole")
        }
        const primary = pickPrimaryAssignment(assignments)
        if (!primary) {
          throw new Error("missingRole")
        }
        token.id = (user as any).id as string
        ;(token as any).meelzaRole = primary.role
        ;(token as any).restaurantId = primary.restaurantId ?? null
        ;(token as any).roles = mapRoleToDashboardRoles(primary.role)
        ;(token as any).roleAssignments = assignments
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id as string
        ;(session.user as any).meelzaRole = (token as any).meelzaRole as MeelzaRole | undefined
        ;(session.user as any).roles = ((token as any).roles as string[]) ?? []
        ;(session.user as any).restaurantId = (token as any).restaurantId ?? null
        ;(session.user as any).roleAssignments = (token as any).roleAssignments ?? []
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
