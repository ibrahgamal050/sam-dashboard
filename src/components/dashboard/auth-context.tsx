// src/components/dashboard/auth-context.tsx
"use client";
import { createContext, useContext } from "react";
import type { Session } from "next-auth";

const Ctx = createContext<Session | null>(null);
export function DashboardAuthProvider({ value, children }: { value: Session; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useDashboardSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useDashboardSession must be used within DashboardAuthProvider");
  return s;
}
