'use client'

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Activity, ArrowUpRight, Building2, MapPin, Plus, ShieldCheck, Sparkles, Store } from "lucide-react"

import { RestaurantsTable } from "@/components/dashboard/restaurants-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import type { IRestaurant } from "@/types/restaurant"
import { buildDashboardSitePath } from "@/lib/dashboard-site-path"

type AccessibleSite = {
  id: string
  type: "restaurant" | "supermarket"
  name: { ar?: string; en?: string } | string
  slug: string
  subdomain?: string
  logoUrl?: string | null
  coverImage?: string | null
  description?: string | null
  isPublished?: boolean
  phones?: string[]
  updatedAt?: string | null
  role?: string | null
}

const normalizeName = (value: AccessibleSite["name"]) => {
  if (typeof value === "string") {
    return { ar: value, en: value }
  }
  return { ar: value?.ar || value?.en || "", en: value?.en || value?.ar || "" }
}

export default function RestaurantDashboard() {
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([])
  const [supermarkets, setSupermarkets] = useState<AccessibleSite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/me/sites", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("تعذر جلب المواقع")
      }
      const data = await response.json()
      const sites = Array.isArray(data?.sites) ? (data.sites as AccessibleSite[]) : []
      const restaurantSites = sites.filter((site) => site.type === "restaurant")
      const supermarketSites = sites.filter((site) => site.type === "supermarket")
      setRestaurants(
        restaurantSites.map((site) => ({
          _id: site.id,
          name: normalizeName(site.name),
          subdomain: site.subdomain || site.slug,
          logo: site.logoUrl || "",
          coverImage: site.coverImage || "",
          description: site.description || "",
          branches: [],
          isPublished: Boolean(site.isPublished),
          phones: site.phones || [],
          updatedAt: site.updatedAt || undefined,
        })),
      )
      setSupermarkets(supermarketSites)
    } catch (err) {
      setError("حدث خطأ أثناء جلب المواقع")
      console.error(err)
      toast({
        title: "خطأ",
        description: "تعذر جلب المواقع. حاول مرة أخرى.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalRestaurants = restaurants.length
  const publishedCount = restaurants.filter((restaurant) => restaurant.isPublished).length
  const draftCount = Math.max(0, totalRestaurants - publishedCount)
  const averageBranches =
    totalRestaurants === 0
      ? 0
      : Math.round(
          restaurants.reduce((acc, restaurant) => acc + (restaurant.branches?.length || 0), 0) / totalRestaurants,
        )
  const publishedRate = totalRestaurants === 0 ? 0 : Math.round((publishedCount / totalRestaurants) * 100)
  const momentumScore = Math.min(96, Math.max(48, Math.round(publishedRate * 0.55 + averageBranches * 9)))

  const recentRestaurants = useMemo(() => {
    return [...restaurants]
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bDate - aDate
      })
      .slice(0, 3)
  }, [restaurants])

  const performanceTrend = [68, 74, 79, 72, 85, 81]
  const averagePerformance = Math.round(performanceTrend.reduce((acc, value) => acc + value, 0) / performanceTrend.length)

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">جارٍ تحميل لوحة التحكم...</div>
  }

  if (error) {
    return <div className="mt-8 text-center text-red-500">{error}</div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f5f9ff] via-white to-[#e9f4ff] text-right">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-16 h-64 w-64 rounded-full bg-[#d8ecff]/60 blur-3xl" />
        <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-[#dcefff]/60 blur-3xl" />
        <div className="absolute bottom-10 right-20 h-72 w-72 rounded-full bg-[#e9f4ff]/70 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-10 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2f7fb2]">نظرة عامة</p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">لوحة التحكم</h1>
            <p className="max-w-2xl text-muted-foreground">
              تابِع المطاعم والمتاجر المرتبطة بحسابك وابدأ بسرعة بلمسة واحدة.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-[#cfe6ff] text-[#256a9a] hover:bg-[#edf6ff]">
              تصدير التقرير
            </Button>
            <Button asChild className="gap-2 bg-[#46b6ff] text-white shadow-lg shadow-[0_18px_30px_rgba(70,182,255,0.35)] hover:bg-[#3aa7df]">
              <Link href="/dashboard/restaurants/new">
                <Plus className="h-4 w-4" />
                إضافة مطعم
              </Link>
            </Button>
          </div>
        </div>

      
       

        {supermarkets.length > 0 && (
          <Card className="border-[#d9ecff] bg-white/80 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2f7fb2]">السوبرماركت</p>
              <CardTitle className="text-2xl">المتاجر المرتبطة بحسابك</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {supermarkets.map((market) => (
                <Card
                  key={market.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#d9ecff] bg-[#eef6ff] px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2f7fb2]">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {typeof market.name === "string" ? market.name : market.name?.ar || market.name?.en}
                      </p>
                      <p className="text-xs text-muted-foreground">{market.slug}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="rounded-full bg-[#46b6ff] text-white hover:bg-[#3aa7df]">
                    <Link href={buildDashboardSitePath(market)}>فتح اللوحة</Link>
                  </Button>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        <RestaurantsTable data={restaurants} />
      </div>
    </div>
  )
}
