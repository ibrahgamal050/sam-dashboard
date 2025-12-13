// src/server/auth/require-session.ts
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/server/auth/nextauth-options";

type DashboardRoles = "USER" | "ADMIN" | "SUPERADMIN"

type RequireAuthOptions = {
  requiredRoles?: Array<DashboardRoles>;
  callbackUrl?: string; // مثال: "/dashboard" أو "/dashboard/orders"
};

function hasRequiredRole(session: Session, required?: RequireAuthOptions["requiredRoles"]) {
  if (!required?.length) return true;
  const roles = (session as any)?.user?.roles as string[] | undefined;
  if (!roles || !roles.length) return false;
  return required.some((r) => roles.includes(r));
}

export async function requireServerAuth(opts: RequireAuthOptions = {}) {
  const session = await getServerSession(authOptions);

  // لو مفيش سيشن → حوّل لصفحة الدخول مع callbackUrl
  if (!session) {
    const cb = opts.callbackUrl || "/";
    // خليه نسبي، NextAuth هيكمله بناءً على NEXTAUTH_URL
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(cb)}`);
  }

  // اختياري: تأكد إن حالة المستخدم تسمح بالدخول
  const status = (session as any)?.user?.status as string | undefined;
  if (status && status !== "READY") {
    // تقدر تبعته لمعالج إكمال أمان بدل منع عام
    redirect(`/auth/signin?error=AccessDenied&callbackUrl=${encodeURIComponent(opts.callbackUrl || "/")}`);
  }

  const meelzaRole = (session as any)?.user?.meelzaRole as string | undefined;
  const restaurantId = (session as any)?.user?.restaurantId as string | null | undefined;

  if (meelzaRole !== "meelza_admin" && !restaurantId) {
    redirect(`/auth/signin?error=MissingRestaurant&callbackUrl=${encodeURIComponent(opts.callbackUrl || "/")}`);
  }

  // فحص الأدوار لو مطلوبة
  if (!hasRequiredRole(session!, opts.requiredRoles)) {
    // امّا ترجع 403 page أو تحول لصفحة Unauthorized
    redirect("/unauthorized");
  }

  return session!;
}
