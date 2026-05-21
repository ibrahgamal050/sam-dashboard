import { getLocalSessionUser } from "@/lib/auth/local-session";

export type MeelzaUser = {
  sub?: string;
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
  role?: string;
  roles?: unknown[];
  roleAssignments?: unknown[];
  restaurantId?: string | null;
  supermarketId?: string | null;
  brandId?: string | null;
  [key: string]: unknown;
};

export async function getMeelzaUser(): Promise<MeelzaUser | null> {
  const user = await getLocalSessionUser();
  if (!user) return null;

  return {
    ...user,
    sub: user.id,
  };
}
