import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams?: Promise<{ callbackUrl?: string; redirect?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const search = searchParams ? await searchParams : {};
  const returnUrl = search.callbackUrl || search.redirect || "/dashboard";
  redirect(`/auth/login?return_url=${encodeURIComponent(returnUrl)}`);
}
