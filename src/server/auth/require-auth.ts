// src/server/auth/require-auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./nextauth-options";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(role: "ADMIN" | "SUPERADMIN") {
  const session = await requireAuth();
  const roles = (session as any).user.roles as string[] | undefined;
  if (!roles?.includes(role)) throw new Error("FORBIDDEN");
  return session;
}
