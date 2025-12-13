// /src/server/tenant/resolve.ts
import { cache } from "react"
import Restaurant from "@/models/Restaurant"
import connectDB from '@/lib/dbConnect';

// لو بتخزن الدومينات/الساب دومينات داخل المطعم
// مثال: { subdomain: "hadramotantar", hosts: ["hadramotantar.meelza.com", "hadramotantar.com"] }

const stripPort = (host: string) => host.split(":")[0].trim().toLowerCase()
const stripWWW = (host: string) => host.replace(/^www\./i, "")

export const getRestaurantBySubdomain = cache(async (sub: string) => {
  await connectDB()
  const s = (sub || "").toLowerCase()
  // ابحث بالحقل اللي عندك (عدّل حسب سكيمتك)
  return Restaurant.findOne({
    $or: [
      { subdomain: s },
      { "domains.subdomain": s }, // لو مخزّنها داخل مصفوفة
    ],
  })
})

export const getRestaurantByHost = cache(async (host: string) => {
  await connectDB()
  const h = stripWWW(stripPort(host || ""))
  // ابحث في hosts المربوطة بالمطعم
  return Restaurant.findOne({
    $or: [
      { "domains.hosts": h },
      { hosts: h },              // لو عندك حقل مباشر
      { primaryHost: h },        // لو بتخزن دومين أساسي
    ],
  })
})

// مفيدة لما تحتاج تحدد المطعم من داخل Server Component أو Route بالهيدر
import { headers } from "next/headers"
export async function resolveRestaurantFromHeaders() {
  const h = await headers() // Next.js 15 يتطلب await
  const host = h.get("x-forwarded-host") || h.get("host") || ""
  const restaurant = await getRestaurantByHost(host)
  return { host, restaurant }
}
