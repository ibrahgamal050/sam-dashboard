import { cookies } from "next/headers";

export type MeelzaUser = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: unknown;
};

const ISSUER = process.env.MEELZA_ID_ISSUER || "http://localhost:3004";

export async function getMeelzaUser(): Promise<MeelzaUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("meelza_access_token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${ISSUER}/api/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const user = (await res.json()) as MeelzaUser;
    return user || null;
   
  } catch {
    return null;
  }
}
