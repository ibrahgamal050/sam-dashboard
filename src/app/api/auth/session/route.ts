import { NextResponse, type NextRequest } from "next/server";
import { getMeelzaUser } from "@/lib/auth/meelza-session";

export async function GET(_request: NextRequest) {
  const user = await getMeelzaUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
