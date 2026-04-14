import { NextResponse, type NextRequest } from "next/server";

const ISSUER = process.env.MEELZA_ID_ISSUER || "http://localhost:3004";
const CLIENT_ID = process.env.MEELZA_ID_CLIENT_ID || "";
const CLIENT_SECRET = process.env.MEELZA_ID_CLIENT_SECRET || "";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3001";
const REDIRECT_URI = process.env.MEELZA_ID_REDIRECT_URI || `${APP_URL}/auth/callback`;

function decodeState(state?: string | null) {
  if (!state) return "/dashboard";
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (parsed?.returnUrl && typeof parsed.returnUrl === "string") {
      return parsed.returnUrl;
    }
  } catch {}
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const returnUrl = decodeState(state);

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/auth/login?error=missing_code`);
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ error: "missing_client_credentials" }, { status: 500 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const tokenResponse = await fetch(`${ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${APP_URL}/auth/login?error=token_failed`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData?.access_token;

  if (!accessToken) {
    return NextResponse.redirect(`${APP_URL}/auth/login?error=missing_token`);
  }

  const response = NextResponse.redirect(new URL(returnUrl, APP_URL));
  response.cookies.set("meelza_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
