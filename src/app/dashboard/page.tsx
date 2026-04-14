'use client'

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Building2, Plus, Store } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

type AccessibleSite = {
  id: string
  type: "restaurant" | "supermarket"
  name: { ar?: string; en?: string } | string
  slug: string
  subdomain?: string
  logoUrl?: string | null
  coverImage?: string | null
  description?: { ar?: string; en?: string } | string | null
  isPublished?: boolean
  phones?: string[]
  updatedAt?: string | null
  role?: string | null
}

const normalizeName = (value: AccessibleSite["name"]) => {
  if (typeof value === "string") {
    return { ar: value, en: value }
  }

  return {
    ar: value?.ar || value?.en || "",
    en: value?.en || value?.ar || "",
  }
}

const resolveLocalizedText = (value?: { ar?: string; en?: string } | string | null) => {
  if (!value) return ""
  if (typeof value === "string") return value
  return value.ar || value.en || ""
}

const formatRelativeType = (type: AccessibleSite["type"]) => {
  return type === "restaurant" ? "مطعم" : "سوبرماركت"
}

export default function DashboardPage() {
  const [sites, setSites] = useState<AccessibleSite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/me/sites", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("تعذر جلب المواقع")
      }

      const data = await response.json()
      const nextSites = Array.isArray(data?.sites) ? (data.sites as AccessibleSite[]) : []
      setSites(nextSites)
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

  const stats = useMemo(() => {
    const totalSites = sites.length
    const restaurantsCount = sites.filter((site) => site.type === "restaurant").length
    const supermarketsCount = sites.filter((site) => site.type === "supermarket").length
    const publishedCount = sites.filter((site) => Boolean(site.isPublished)).length

    return {
      totalSites,
      restaurantsCount,
      supermarketsCount,
      publishedCount,
    }
  }, [sites])

  const sortedSites = useMemo(() => {
    return [...sites].sort((a, b) => {
      const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return bDate - aDate
    })
  }, [sites])

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
              تابِع المطاعم والسوبرماركت المرتبطة بحسابك من مكان واحد.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-[#cfe6ff] text-[#256a9a] hover:bg-[#edf6ff]">
              تصدير التقرير
            </Button>
            <Button asChild className="gap-2 bg-[#46b6ff] text-white shadow-lg shadow-[0_18px_30px_rgba(70,182,255,0.35)] hover:bg-[#3aa7df]">
              <Link href="/dashboard/restaurants/new">
                <Plus className="h-4 w-4" />
                إضافة موقع جديد
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-[#d9ecff] bg-white/80 shadow-xl backdrop-blur">
            <CardContent className="flex items-center justify-between px-5 py-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">إجمالي المواقع</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalSites}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#d9ecff] bg-white/80 shadow-xl backdrop-blur">
            <CardContent className="flex items-center justify-between px-5 py-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">المطاعم</p>
                <p className="text-3xl font-bold text-slate-900">{stats.restaurantsCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#d9ecff] bg-white/80 shadow-xl backdrop-blur">
            <CardContent className="flex items-center justify-between px-5 py-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">السوبرماركت</p>
                <p className="text-3xl font-bold text-slate-900">{stats.supermarketsCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
                <Store className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#d9ecff] bg-white/80 shadow-xl backdrop-blur">
            <CardContent className="flex items-center justify-between px-5 py-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">المنشور</p>
                <p className="text-3xl font-bold text-slate-900">{stats.publishedCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#d9ecff] bg-white/80 shadow-2xl backdrop-blur">
          <CardHeader className="flex flex-col gap-3 border-b border-[#edf6ff] pb-5 sm:flex-row-reverse sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2f7fb2]">المحفظة</p>
              <CardTitle className="text-2xl">المواقع المرتبطة بحسابك</CardTitle>
              <CardDescription className="max-w-xl">
                كل المطاعم والسوبرماركت تظهر هنا في قائمة موحدة مع تمييز نوع كل موقع.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {sortedSites.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#cfe6ff] bg-[#f8fbff] text-center">
                <Building2 className="h-8 w-8 text-[#2f7fb2]" />
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-900">لا توجد مواقع مرتبطة بهذا الحساب</p>
                  <p className="text-sm text-muted-foreground">ابدأ بإضافة أول مطعم أو سوبرماركت إلى لوحة التحكم.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedSites.map((site) => {
                  const normalizedName = normalizeName(site.name)
                  const displayName = normalizedName.ar || normalizedName.en || site.slug
                  const logo = site.logoUrl || site.coverImage
                  const description = resolveLocalizedText(site.description)

                  return (
                    <Card
                      key={site.id}
                      className="overflow-hidden rounded-3xl border border-[#d9ecff] bg-[#fdfefe] shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <CardContent className="space-y-5 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge className="rounded-full bg-[#eef6ff] px-3 py-1 text-[#2f7fb2] hover:bg-[#eef6ff]">
                                {formatRelativeType(site.type)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={site.isPublished ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}
                              >
                                {site.isPublished ? "منشور" : "مسودة"}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-lg font-bold text-slate-900">{displayName}</h3>
                              <p className="text-sm text-muted-foreground">{site.subdomain || site.slug}</p>
                            </div>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
                            {logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={logo} alt={displayName} className="h-full w-full object-cover" />
                            ) : site.type === "restaurant" ? (
                              <Building2 className="h-5 w-5" />
                            ) : (
                              <Store className="h-5 w-5" />
                            )}
                          </div>
                        </div>

                        {description ? (
                          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">لا يوجد وصف مضاف لهذا الموقع حتى الآن.</p>
                        )}

                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-muted-foreground">
                            {site.role ? `الدور: ${site.role}` : "صلاحية مالك"}
                          </div>
                          <Button asChild size="sm" className="rounded-full bg-[#46b6ff] text-white hover:bg-[#3aa7df]">
                            <Link href={`/dashboard/${site.slug}`}>
                              فتح اللوحة
                              <ArrowUpRight className="mr-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
