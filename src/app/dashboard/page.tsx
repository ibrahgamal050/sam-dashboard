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

      
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-[#d9ecff] bg-white/80 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2f7fb2]">الحالة المباشرة</p>
              <CardTitle className="text-2xl">صحة المحفظة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-[#eef6ff] px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff0ff] text-[#2f7fb2]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{publishedRate}% منشور</p>
                  <p className="text-xs text-muted-foreground">مواقع جاهزة ومرئية للضيوف</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#eef6ff] px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff0ff] text-[#2f7fb2]">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{momentumScore}% زخم</p>
                  <p className="text-xs text-muted-foreground">تحديثات منتظمة وتغطية للفروع</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#eef6ff] px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff0ff] text-[#2f7fb2]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{averageBranches} متوسط الفروع</p>
                  <p className="text-xs text-muted-foreground">تغطية لجميع المطاعم المدرجة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d9ecff] bg-white/80 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2f7fb2]">الأداء</p>
              <CardTitle className="text-2xl">اتجاه أسبوعي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المتوسط</p>
                  <p className="text-3xl font-semibold text-[#2f7fb2]">{averagePerformance}%</p>
                </div>
                <Badge className="bg-[#dff0ff] text-[#256a9a]">+4% مقارنة بالأسبوع الماضي</Badge>
              </div>
              <div className="flex h-36 items-end gap-2">
                {performanceTrend.map((value, index) => (
                  <div key={index} className="flex-1 h-full rounded-full bg-[#dff0ff]">
                    <div
                      className="relative m-1 rounded-full bg-gradient-to-t from-[#8fd1ff] via-[#6ec3ff] to-[#46b6ff] shadow-inner"
                      style={{ height: `${value}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#2f7fb2]">
                        {value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">رفع قوائم جديدة وتحديثات الإعدادات يوميًا.</p>
            </CardContent>
          </Card>

          <Card className="border-[#d9ecff] bg-white/80 shadow-xl backdrop-blur xl:col-span-2">
            <CardHeader className="pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2f7fb2]">الأحدث</p>
              <CardTitle className="text-2xl">أحدث المطاعم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentRestaurants.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#cfe6ff] bg-[#eef6ff] px-4 py-6 text-center">
                  <p className="font-semibold text-sky-900">لا توجد مطاعم بعد</p>
                  <p className="text-sm text-muted-foreground">ابدأ بإضافة أول مطعم لتظهر النتائج هنا.</p>
                </div>
              )}

              {recentRestaurants.map((restaurant) => (
                <div
                  key={restaurant._id ?? restaurant.subdomain}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#d9ecff] bg-[#eef6ff] px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dff0ff] to-white text-[#2f7fb2]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {restaurant.name.ar || restaurant.name.en}
                      </p>
                      <p className="text-xs text-muted-foreground">{restaurant.subdomain}.meelza.site</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      restaurant.isPublished
                        ? "border-[#b9dcff] bg-[#dff0ff] text-[#256a9a]"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }
                  >
                    {restaurant.isPublished ? "منشور" : "مسودة"}
                  </Badge>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-2xl border border-[#d9ecff] bg-white px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff0ff] text-[#2f7fb2]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">خريطة التغطية</p>
                    <p className="text-xs text-muted-foreground">تابِع الفروع الجديدة في ثوانٍ.</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="border-[#cfe6ff] text-[#256a9a] hover:bg-[#edf6ff]">
                  <Link href="/dashboard/restaurants/new">إضافة فرع</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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
                    <Link href={`/dashboard/${market.slug}`}>فتح اللوحة</Link>
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
