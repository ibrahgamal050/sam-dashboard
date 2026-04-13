"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Copy, FilePlus, Globe, Loader2, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { BuilderSection } from "@/types/page"

interface PageDocument {
  _id?: string
  name: string
  slug: string
  language: string
  isPublished: boolean
  metadata: {
    created_at: string
    updated_at: string
    published_at?: string
  }
  sections?: BuilderSection[]
}

interface FetchResponse {
  success: boolean
  data: {
    pages: PageDocument[]
  }
}

export default function PagesDashboard() {
  const params = useParams()
  const router = useRouter()
  const subdomain = Array.isArray(params?.subdomain) ? params.subdomain[0] : (params?.subdomain as string) ?? ""

  const [pages, setPages] = useState<PageDocument[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/${subdomain}/pages`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error("تعذر تحميل الصفحات")
        }
        const data: FetchResponse = await response.json()
        setPages(data.data.pages || [])
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error(err)
          setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (subdomain) {
      load()
    }

    return () => controller.abort()
  }, [subdomain])

  const selectablePageIds = useMemo(
    () => pages.map((page) => page._id).filter((id): id is string => Boolean(id)),
    [pages],
  )

  const allSelected =
    selectablePageIds.length > 0 && selectedIds.length === selectablePageIds.length

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(selectablePageIds)
    } else {
      setSelectedIds([])
    }
  }

  const toggleSelectPage = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id]
      }
      return prev.filter((selectedId) => selectedId !== id)
    })
  }

  const deletePage = async (id: string) => {
    try {
      const response = await fetch(`/api/${subdomain}/pages/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete page")
      setPages((prev) => prev.filter((page) => page._id !== id))
      toast({ title: "تم حذف الصفحة" })
    } catch (err) {
      toast({
        title: "فشل الحذف",
        description: err instanceof Error ? err.message : "حدث خطأ غير معروف",
        variant: "destructive",
      })
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    try {
      const response = await fetch(`/api/${subdomain}/pages/delete-multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!response.ok) throw new Error("Failed to delete selected pages")
      setPages((prev) =>
        prev.filter((page) => {
          const pageId = page._id
          return typeof pageId !== "string" || !selectedIds.includes(pageId)
        }),
      )
      setSelectedIds([])
      toast({ title: "تم حذف الصفحات المحددة" })
    } catch (err) {
      toast({
        title: "فشل الحذف الجماعي",
        description: err instanceof Error ? err.message : "حدث خطأ غير معروف",
        variant: "destructive",
      })
    }
  }

  const copyLink = async (slug: string) => {
    try {
      const url = `${window.location.origin}/${slug}`
      await navigator.clipboard.writeText(url)
      toast({ title: "تم نسخ رابط الصفحة", description: url })
    } catch (err) {
      toast({
        title: "فشل النسخ",
        description: "تعذر النسخ إلى الحافظة",
        variant: "destructive",
      })
    }
  }

  const summary = useMemo(() => {
    const published = pages.filter((page) => page.isPublished).length
    return [
      { label: "إجمالي الصفحات", value: pages.length },
      { label: "المنشور", value: published },
      { label: "المسودات", value: pages.length - published },
    ]
  }, [pages])

  const getEditorUrl = (page: PageDocument) => {
    if (page._id) {
      return `/dashboard/${subdomain}/pages/${page._id}`
    }
    const search = new URLSearchParams({
      slug: page.slug,
      language: page.language,
    })
    return `/dashboard/${subdomain}/pages/slug?${search.toString()}`
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <section className="space-y-6 text-right">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row-reverse sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">الصفحات</h1>
          <p className="text-sm text-slate-500">إدارة صفحات الهبوط والمحتوى الترويجي والتجارب متعددة اللغات.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-full border-slate-300 text-sm text-slate-600"
            onClick={deleteSelected}
            disabled={selectedIds.length === 0}
          >
            حذف المحدد
          </Button>
          <Button asChild className="gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            <Link href={`/dashboard/${subdomain}/pages/create`}>
              <FilePlus className="h-4 w-4" />
              صفحة جديدة
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((card) => (
          <Card key={card.label} className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

        <Card className="border border-slate-200">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">
            كل الصفحات
          </CardTitle>
          <p className="text-xs text-slate-500">عرض {pages.length} نتيجة</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                    aria-label="تحديد كل الصفحات"
                  />
                </TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>اللغة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead>نسخ</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => {
                const pageId = page._id ?? ""
                const selectable = Boolean(pageId)
                return (
                  <TableRow key={pageId || page.slug} className="text-sm text-slate-700">
                    <TableCell>
                      <Checkbox
                        disabled={!selectable}
                        checked={selectable && selectedIds.includes(pageId)}
                        onCheckedChange={(checked) => selectable && toggleSelectPage(pageId, Boolean(checked))}
                        aria-label={`تحديد صفحة ${page.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{page.name}</span>
                        {page.sections?.length ? (
                          <Badge className="rounded-full border border-amber-200 bg-amber-50 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            منشئ
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={page.isPublished ? "secondary" : "outline"}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs",
                          page.isPublished
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700",
                        )}
                      >
                        {page.isPublished ? "منشور" : "مسودة"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full border-slate-200 text-slate-600">
                        {page.language.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {page.metadata?.created_at
                        ? new Date(page.metadata.created_at).toLocaleDateString()
                        : "--"}
                    </TableCell>
                    <TableCell>
                      {page.metadata?.updated_at
                        ? new Date(page.metadata.updated_at).toLocaleDateString()
                        : "--"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-slate-900"
                        onClick={() => copyLink(page.slug)}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                    <div className="flex justify-start gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            if (!page._id && !page.slug) {
                              toast({
                                title: "معرّفات مفقودة",
                                description: "هذه الصفحة لا تحتوي على معرّف أو سلاج.",
                                variant: "destructive",
                              })
                              return
                            }
                            router.push(getEditorUrl(page))
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-800 disabled:opacity-40"
                          disabled={!selectable}
                          onClick={() => selectable && deletePage(pageId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {pages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-slate-500">
                    لا توجد صفحات بعد. ابدأ بإنشاء أول صفحة.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
