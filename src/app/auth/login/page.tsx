import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<{ return_url?: string }>;
};

const ISSUER = process.env.MEELZA_ID_ISSUER || "http://localhost:3004";
const CLIENT_ID = process.env.MEELZA_ID_CLIENT_ID || "";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3001";
const REDIRECT_URI = process.env.MEELZA_ID_REDIRECT_URI || `${APP_URL}/auth/callback`;

function encodeState(returnUrl: string) {
  return Buffer.from(JSON.stringify({ returnUrl })).toString("base64url");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const search = searchParams ? await searchParams : {};
  const returnUrl = search.return_url || "/dashboard";

  if (!CLIENT_ID) {
    redirect(`${APP_URL}/auth/login?error=missing_client_id`);
  }

  const authUrl = new URL("/oauth/authorize", ISSUER);
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("state", encodeState(returnUrl));

  redirect(authUrl.toString());
}
