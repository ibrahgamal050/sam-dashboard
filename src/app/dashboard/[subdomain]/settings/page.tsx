"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, Save, Upload, Clock, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

const UPLOAD_ENDPOINT = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL ?? "http://localhost:3002/api/upload"
const UPLOAD_KEY = process.env.NEXT_PUBLIC_UPLOAD_ADMIN_KEY
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "http://localhost:3002"

const trimTrailingSlash = (value: string) => (value.endsWith("/") ? value.slice(0, -1) : value)
const resolveImageUrl = (value: string | null) => {
  if (!value) return null
  if (value.startsWith("http")) return value
  const base = trimTrailingSlash(IMAGE_BASE_URL)
  const path = value.startsWith("/") ? value : `/images/${value}`
  return `${base}${path}`
}

const dayLabels = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
]

type OpeningHour = {
  day: number
  open: string
  close: string
  isClosed?: boolean
}

type SettingsForm = {
  targetType: "restaurant" | "supermarket"
  nameAr: string
  nameEn: string
  slug: string
  description: string
  address: string
  city: string
  country: string
  cuisines: string[]
  tags: string[]
  logoUrl: string
  coverImage: string
  gallery: string[]
  brandColors: { primary?: string; secondary?: string }
  delivery: { etaMin?: number; etaMax?: number; fee?: number; minOrder?: number; enabled?: boolean }
  orderSettings: {
    acceptance: { mode: "auto" | "manual"; autoCancelAfterMins?: number; busyMode?: boolean }
    availability: { isOpenNow: boolean; pauseOrders: boolean; pauseReason?: string }
    delivery: { enabled: boolean; fee: number; minOrder: number; etaMin: number; etaMax: number }
    pickup: { enabled: boolean; preparationMins: number }
    payment: { cashOnDelivery: boolean; onlinePayment: boolean; walletEnabled: boolean }
  }
  openingHours: OpeningHour[]
  contact: { phone?: string; whatsapp?: string; website?: string; email?: string; googleMapsUrl?: string }
  social: { facebook?: string; instagram?: string; tiktok?: string; twitter?: string }
  menuSettings: {
    disabledCategories?: string[]
    categoryOrder?: string[]
    unavailableLabel?: string
    soldOutLabel?: string
    itemsImagesEnabled?: boolean
  }
  status: "draft" | "published" | "archived"
  featured: boolean
  isActive: boolean
}

const emptyForm = (targetType: SettingsForm["targetType"], slug: string): SettingsForm => ({
  targetType,
  nameAr: "",
  nameEn: "",
  slug,
  description: "",
  address: "",
  city: "",
  country: "",
  cuisines: [],
  tags: [],
  logoUrl: "",
  coverImage: "",
  gallery: [],
  brandColors: {},
  delivery: { enabled: true },
  orderSettings: {
    acceptance: { mode: "auto", autoCancelAfterMins: 2, busyMode: false },
    availability: { isOpenNow: true, pauseOrders: false, pauseReason: "" },
    delivery: { enabled: true, fee: 0, minOrder: 0, etaMin: 0, etaMax: 0 },
    pickup: { enabled: true, preparationMins: 0 },
    payment: { cashOnDelivery: true, onlinePayment: false, walletEnabled: true },
  },
  openingHours: dayLabels.map((_, idx) => ({ day: idx, open: "09:00", close: "23:00", isClosed: false })),
  contact: {},
  social: {},
  menuSettings: { disabledCategories: [], categoryOrder: [], itemsImagesEnabled: true },
  status: "draft",
  featured: false,
  isActive: true,
})

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const formatList = (value?: string[]) => (value && value.length ? value.join(", ") : "")

export default function SettingsPage() {
  const params = useParams()
  const subdomain = Array.isArray(params?.subdomain) ? params.subdomain[0] : params?.subdomain ?? ""
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("basic")
  const [form, setForm] = useState<SettingsForm>(() => emptyForm("restaurant", subdomain))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [menuJson, setMenuJson] = useState("")
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const openNow = useMemo(() => {
    const now = new Date()
    const today = now.getDay()
    const entry = form.openingHours.find((item) => item.day === today)
    if (!entry || entry.isClosed) return false
    const [openH, openM] = entry.open.split(":").map((v) => Number(v))
    const [closeH, closeM] = entry.close.split(":").map((v) => Number(v))
    const minutes = now.getHours() * 60 + now.getMinutes()
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM
    if (closeMinutes < openMinutes) {
      return minutes >= openMinutes || minutes <= closeMinutes
    }
    return minutes >= openMinutes && minutes <= closeMinutes
  }, [form.openingHours])

  useEffect(() => {
    let cancelled = false

    const loadSettings = async () => {
      if (!subdomain) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const restaurantRes = await fetch(`/api/restaurants/${encodeURIComponent(subdomain)}`, {
          cache: "no-store",
        })
        if (restaurantRes.ok) {
          const data = await restaurantRes.json()
          if (cancelled) return
          setForm((prev) => ({
            ...prev,
            targetType: "restaurant",
            nameAr: data.name?.ar ?? "",
            nameEn: data.name?.en ?? "",
            slug: data.subdomain ?? subdomain,
            description: data.description ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            country: data.country ?? "",
            cuisines: Array.isArray(data.cuisines) ? data.cuisines : [],
            tags: Array.isArray(data.tags) ? data.tags : [],
            logoUrl: data.logo ?? "",
            coverImage: data.coverImage ?? "",
            gallery: Array.isArray(data.gallery) ? data.gallery : [],
            brandColors: data.brandColors ?? {},
            delivery: data.delivery ?? { enabled: true },
            orderSettings: {
              acceptance: {
                mode: data.orderSettings?.acceptance?.mode ?? "auto",
                autoCancelAfterMins: data.orderSettings?.acceptance?.autoCancelAfterMins ?? 2,
                busyMode: data.orderSettings?.acceptance?.busyMode ?? false,
              },
              availability: {
                isOpenNow: data.orderSettings?.availability?.isOpenNow ?? true,
                pauseOrders: data.orderSettings?.availability?.pauseOrders ?? false,
                pauseReason: data.orderSettings?.availability?.pauseReason ?? "",
              },
              delivery: {
                enabled: data.orderSettings?.delivery?.enabled ?? data.delivery?.enabled ?? true,
                fee: data.orderSettings?.delivery?.fee ?? data.delivery?.fee ?? 0,
                minOrder: data.orderSettings?.delivery?.minOrder ?? data.delivery?.minOrder ?? 0,
                etaMin: data.orderSettings?.delivery?.etaMin ?? data.delivery?.etaMin ?? 0,
                etaMax: data.orderSettings?.delivery?.etaMax ?? data.delivery?.etaMax ?? 0,
              },
              pickup: {
                enabled: data.orderSettings?.pickup?.enabled ?? true,
                preparationMins: data.orderSettings?.pickup?.preparationMins ?? 0,
              },
              payment: {
                cashOnDelivery: data.orderSettings?.payment?.cashOnDelivery ?? true,
                onlinePayment: data.orderSettings?.payment?.onlinePayment ?? false,
                walletEnabled: data.orderSettings?.payment?.walletEnabled ?? true,
              },
            },
            openingHours: Array.isArray(data.openingHours) && data.openingHours.length
              ? data.openingHours
              : prev.openingHours,
            contact: data.contact ?? {},
            social: data.social ?? {},
            menuSettings: data.menuSettings ?? { disabledCategories: [], categoryOrder: [], itemsImagesEnabled: true },
            status: data.status ?? "draft",
            featured: Boolean(data.featured),
            isActive: data.isActive ?? true,
          }))
          setIsLoading(false)
          return
        }

        const marketRes = await fetch(`/api/retail/supermarkets/slug/${encodeURIComponent(subdomain)}`, {
          cache: "no-store",
        })
        if (!marketRes.ok) {
          throw new Error("Failed to load settings")
        }

        const data = await marketRes.json()
        if (cancelled) return
        setForm((prev) => ({
          ...prev,
          targetType: "supermarket",
          nameAr: data.nameAr ?? data.name ?? "",
          nameEn: data.nameEn ?? "",
          slug: data.slug ?? subdomain,
          description: data.description ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
          cuisines: Array.isArray(data.cuisines) ? data.cuisines : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          logoUrl: data.logoUrl ?? "",
          coverImage: data.coverImage ?? "",
          gallery: Array.isArray(data.gallery) ? data.gallery : [],
          brandColors: data.brandColors ?? {},
          delivery: data.delivery ?? { enabled: true },
          orderSettings: {
            acceptance: {
              mode: data.orderSettings?.acceptance?.mode ?? "auto",
              autoCancelAfterMins: data.orderSettings?.acceptance?.autoCancelAfterMins ?? 2,
              busyMode: data.orderSettings?.acceptance?.busyMode ?? false,
            },
            availability: {
              isOpenNow: data.orderSettings?.availability?.isOpenNow ?? true,
              pauseOrders: data.orderSettings?.availability?.pauseOrders ?? false,
              pauseReason: data.orderSettings?.availability?.pauseReason ?? "",
            },
            delivery: {
              enabled: data.orderSettings?.delivery?.enabled ?? data.delivery?.enabled ?? true,
              fee: data.orderSettings?.delivery?.fee ?? data.delivery?.fee ?? 0,
              minOrder: data.orderSettings?.delivery?.minOrder ?? data.delivery?.minOrder ?? 0,
              etaMin: data.orderSettings?.delivery?.etaMin ?? data.delivery?.etaMin ?? 0,
              etaMax: data.orderSettings?.delivery?.etaMax ?? data.delivery?.etaMax ?? 0,
            },
            pickup: {
              enabled: data.orderSettings?.pickup?.enabled ?? true,
              preparationMins: data.orderSettings?.pickup?.preparationMins ?? 0,
            },
            payment: {
              cashOnDelivery: data.orderSettings?.payment?.cashOnDelivery ?? true,
              onlinePayment: data.orderSettings?.payment?.onlinePayment ?? false,
              walletEnabled: data.orderSettings?.payment?.walletEnabled ?? true,
            },
          },
          openingHours: Array.isArray(data.openingHours) && data.openingHours.length
            ? data.openingHours
            : prev.openingHours,
          contact: data.contact ?? {},
          social: data.social ?? {},
          menuSettings: data.menuSettings ?? { disabledCategories: [], categoryOrder: [], itemsImagesEnabled: true },
          status: data.status ?? "draft",
          featured: Boolean(data.featured),
          isActive: data.isActive ?? true,
        }))
        setIsLoading(false)
      } catch (loadError) {
        console.error(loadError)
        if (!cancelled) {
          setError("تعذر تحميل الإعدادات من الخادم. سيتم استخدام القيم الافتراضية مؤقتًا.")
          toast({
            title: "تعذر تحميل الإعدادات",
            description: "تحقق من الاتصال ثم حاول مرة أخرى.",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      cancelled = true
    }
  }, [subdomain, toast])

  const updateForm = (patch: Partial<SettingsForm>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const updateOpeningHour = (day: number, patch: Partial<OpeningHour>) => {
    setForm((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((item) =>
        item.day === day ? { ...item, ...patch } : item
      ),
    }))
  }

  const handleUpload = async (file: File, type: "logo" | "cover") => {
    const formData = new FormData()
    formData.append("file", file)
    if (subdomain) {
      formData.append("subdomain", subdomain.toLowerCase())
    }

    try {
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: UPLOAD_KEY ? { "x-upload-key": UPLOAD_KEY } : undefined,
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      if (!result?.ok || !result?.objectName) {
        throw new Error("Upload response missing object name")
      }

      const objectName = String(result.objectName)
      const relativePath = objectName.replace(/^restaurants\//, "")

      updateForm(type === "logo" ? { logoUrl: relativePath } : { coverImage: relativePath })
      toast({ title: "تم رفع الصورة بنجاح" })
    } catch (uploadError) {
      console.error(uploadError)
      toast({
        title: "تعذر رفع الصورة",
        description: "حاول مرة أخرى لاحقًا.",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!subdomain) return

    setIsSaving(true)
    setError(null)

    try {
      if (form.targetType === "restaurant") {
        const payload = {
          name: { ar: form.nameAr, en: form.nameEn },
          subdomain: form.slug,
          description: form.description,
          address: form.address,
          city: form.city,
          country: form.country,
          cuisines: form.cuisines,
          tags: form.tags,
          logo: form.logoUrl,
          coverImage: form.coverImage,
          gallery: form.gallery,
          brandColors: form.brandColors,
          delivery: form.delivery,
          orderSettings: form.orderSettings,
          openingHours: form.openingHours,
          contact: form.contact,
          social: form.social,
          menuSettings: form.menuSettings,
          status: form.status,
          featured: form.featured,
          isActive: form.isActive,
        }
        const response = await fetch(`/api/restaurants/${encodeURIComponent(subdomain)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error("Failed to save settings")
      } else {
        const payload = {
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          description: form.description,
          address: form.address,
          city: form.city,
          country: form.country,
          cuisines: form.cuisines,
          tags: form.tags,
          logoUrl: form.logoUrl,
          coverImage: form.coverImage,
          gallery: form.gallery,
          brandColors: form.brandColors,
          delivery: form.delivery,
          orderSettings: form.orderSettings,
          openingHours: form.openingHours,
          contact: form.contact,
          social: form.social,
          menuSettings: form.menuSettings,
          status: form.status,
          featured: form.featured,
          isActive: form.isActive,
        }
        const response = await fetch(`/api/retail/supermarkets/slug/${encodeURIComponent(subdomain)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error("Failed to save settings")
      }

      toast({ title: "تم حفظ الإعدادات بنجاح" })
    } catch (saveError) {
      console.error(saveError)
      setError("تعذر حفظ الإعدادات. حاول مرة أخرى.")
      toast({
        title: "تعذر الحفظ",
        description: "تأكد من صحة البيانات ثم حاول مرة أخرى.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">إعدادات {form.targetType === "restaurant" ? "المطعم" : "السوبرماركت"}</h1>
          <p className="text-slate-500">حدّث البيانات الأساسية والهوية والخدمات.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
          {isSaving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
          <TabsTrigger value="branding">الصور والهوية</TabsTrigger>
          <TabsTrigger value="order">إعدادات الأوردر</TabsTrigger>
          <TabsTrigger value="hours">ساعات العمل</TabsTrigger>
          <TabsTrigger value="contact">التواصل</TabsTrigger>
          <TabsTrigger value="menu">المنيو</TabsTrigger>
          <TabsTrigger value="publish">النشر</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>البيانات الأساسية</CardTitle>
              <CardDescription>الاسم، الوصف، العنوان، التصنيفات.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الاسم بالعربية</Label>
                  <Input value={form.nameAr} onChange={(e) => updateForm({ nameAr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية</Label>
                  <Input value={form.nameEn} onChange={(e) => updateForm({ nameEn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} readOnly className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input value={form.address} onChange={(e) => updateForm({ address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input value={form.city} onChange={(e) => updateForm({ city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الدولة</Label>
                  <Input value={form.country} onChange={(e) => updateForm({ country: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>المطابخ (مفصولة بفاصلة)</Label>
                  <Input
                    value={formatList(form.cuisines)}
                    onChange={(e) => updateForm({ cuisines: parseList(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (مفصولة بفاصلة)</Label>
                  <Input
                    value={formatList(form.tags)}
                    onChange={(e) => updateForm({ tags: parseList(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>الصور والهوية</CardTitle>
              <CardDescription>الشعار، الغلاف، المعرض، ألوان البراند.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الشعار (Logo)</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                      {form.logoUrl ? (
                        <img
                          src={resolveImageUrl(form.logoUrl) ?? ""}
                          alt="logo"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <Input
                      value={form.logoUrl}
                      onChange={(e) => updateForm({ logoUrl: e.target.value })}
                      placeholder="رابط الشعار"
                    />
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleUpload(file, "logo")
                      }}
                    />
                    <Button variant="outline" type="button" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="ml-2 h-4 w-4" />
                      رفع
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>صورة الغلاف</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                      {form.coverImage ? (
                        <img
                          src={resolveImageUrl(form.coverImage) ?? ""}
                          alt="cover"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <Input
                      value={form.coverImage}
                      onChange={(e) => updateForm({ coverImage: e.target.value })}
                      placeholder="رابط الغلاف"
                    />
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleUpload(file, "cover")
                      }}
                    />
                    <Button variant="outline" type="button" onClick={() => coverInputRef.current?.click()}>
                      <Upload className="ml-2 h-4 w-4" />
                      رفع
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>معرض الصور (روابط مفصولة بسطر جديد)</Label>
                <Textarea
                  value={form.gallery.join("\n")}
                  onChange={(e) => updateForm({ gallery: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) })}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>لون أساسي</Label>
                  <Input
                    value={form.brandColors.primary ?? ""}
                    onChange={(e) => updateForm({ brandColors: { ...form.brandColors, primary: e.target.value } })}
                    placeholder="#25c3b8"
                  />
                </div>
                <div className="space-y-2">
                  <Label>لون ثانوي</Label>
                  <Input
                    value={form.brandColors.secondary ?? ""}
                    onChange={(e) => updateForm({ brandColors: { ...form.brandColors, secondary: e.target.value } })}
                    placeholder="#0f172a"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأوردر</CardTitle>
              <CardDescription>القبول، التوفر، التوصيل، الاستلام، الدفع.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="font-semibold">استقبال الطلبات</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">قبول تلقائي</span>
                    <Switch
                      checked={form.orderSettings.acceptance.mode === "auto"}
                      onCheckedChange={(value) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            acceptance: {
                              ...form.orderSettings.acceptance,
                              mode: value ? "auto" : "manual",
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مهلة القبول (دقيقة)</Label>
                    <Input
                      type="number"
                      value={form.orderSettings.acceptance.autoCancelAfterMins ?? 2}
                      onChange={(e) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            acceptance: {
                              ...form.orderSettings.acceptance,
                              autoCancelAfterMins: Number(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">إيقاف مؤقت (Busy)</span>
                    <Switch
                      checked={form.orderSettings.acceptance.busyMode ?? false}
                      onCheckedChange={(value) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            acceptance: { ...form.orderSettings.acceptance, busyMode: value },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-4 space-y-3">
                  <div className="font-semibold">حالة المطعم</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مفتوح الآن</span>
                    <Switch
                      checked={form.orderSettings.availability.isOpenNow}
                      onCheckedChange={(value) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            availability: { ...form.orderSettings.availability, isOpenNow: value },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">إيقاف استقبال الطلبات</span>
                    <Switch
                      checked={form.orderSettings.availability.pauseOrders}
                      onCheckedChange={(value) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            availability: { ...form.orderSettings.availability, pauseOrders: value },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>سبب الإيقاف</Label>
                    <Input
                      value={form.orderSettings.availability.pauseReason ?? ""}
                      onChange={(e) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            availability: {
                              ...form.orderSettings.availability,
                              pauseReason: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>ETA Min</Label>
                  <Input
                    type="number"
                    value={form.orderSettings.delivery.etaMin}
                    onChange={(e) =>
                      updateForm({
                        orderSettings: {
                          ...form.orderSettings,
                          delivery: { ...form.orderSettings.delivery, etaMin: Number(e.target.value) },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>ETA Max</Label>
                  <Input
                    type="number"
                    value={form.orderSettings.delivery.etaMax}
                    onChange={(e) =>
                      updateForm({
                        orderSettings: {
                          ...form.orderSettings,
                          delivery: { ...form.orderSettings.delivery, etaMax: Number(e.target.value) },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Fee</Label>
                  <Input
                    type="number"
                    value={form.orderSettings.delivery.fee}
                    onChange={(e) =>
                      updateForm({
                        orderSettings: {
                          ...form.orderSettings,
                          delivery: { ...form.orderSettings.delivery, fee: Number(e.target.value) },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Order</Label>
                  <Input
                    type="number"
                    value={form.orderSettings.delivery.minOrder}
                    onChange={(e) =>
                      updateForm({
                        orderSettings: {
                          ...form.orderSettings,
                          delivery: { ...form.orderSettings.delivery, minOrder: Number(e.target.value) },
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">تفعيل التوصيل</p>
                  <p className="text-xs text-slate-500">إيقاف التوصيل سيخفي الخيارات من المستخدمين.</p>
                </div>
                <Switch
                  checked={form.orderSettings.delivery.enabled}
                  onCheckedChange={(value) =>
                    updateForm({
                      orderSettings: {
                        ...form.orderSettings,
                        delivery: { ...form.orderSettings.delivery, enabled: value },
                      },
                    })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="font-semibold">الاستلام من الفرع</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">تفعيل الاستلام</span>
                    <Switch
                      checked={form.orderSettings.pickup.enabled}
                      onCheckedChange={(value) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            pickup: { ...form.orderSettings.pickup, enabled: value },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت التجهيز (دقيقة)</Label>
                    <Input
                      type="number"
                      value={form.orderSettings.pickup.preparationMins}
                      onChange={(e) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            pickup: {
                              ...form.orderSettings.pickup,
                              preparationMins: Number(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-4 space-y-3">
                  <div className="font-semibold">طرق الدفع</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">كاش عند الاستلام</span>
                    <Switch
                      checked={form.orderSettings.payment.cashOnDelivery}
                      onCheckedChange={(value) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            payment: { ...form.orderSettings.payment, cashOnDelivery: value },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">دفع أونلاين</span>
                    <Switch
                      checked={form.orderSettings.payment.onlinePayment}
                      onCheckedChange={(value) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            payment: { ...form.orderSettings.payment, onlinePayment: value },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Wallet</span>
                    <Switch
                      checked={form.orderSettings.payment.walletEnabled}
                      onCheckedChange={(value) =>
                        updateForm({
                          orderSettings: {
                            ...form.orderSettings,
                            payment: { ...form.orderSettings.payment, walletEnabled: value },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>ساعات العمل</CardTitle>
              <CardDescription>حدد مواعيد الفتح والإغلاق لكل يوم.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <Clock className="h-4 w-4" />
                {openNow ? "مفتوح الآن" : "مغلق الآن"}
                {openNow && <CheckCircle2 className="h-4 w-4" />}
              </div>
              <div className="grid gap-3">
                {form.openingHours.map((hour) => (
                  <div key={hour.day} className="grid items-center gap-3 rounded-xl border px-4 py-3 md:grid-cols-5">
                    <div className="font-semibold">{dayLabels[hour.day]}</div>
                    <Input
                      type="time"
                      value={hour.open}
                      onChange={(e) => updateOpeningHour(hour.day, { open: e.target.value })}
                      disabled={hour.isClosed}
                    />
                    <Input
                      type="time"
                      value={hour.close}
                      onChange={(e) => updateOpeningHour(hour.day, { close: e.target.value })}
                      disabled={hour.isClosed}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!hour.isClosed}
                        onCheckedChange={(value) => updateOpeningHour(hour.day, { isClosed: !value })}
                      />
                      <span className="text-sm">مفتوح</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>التواصل والسوشيال</CardTitle>
              <CardDescription>بيانات الاتصال وروابط التواصل الاجتماعي.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.contact.phone ?? ""}
                    onChange={(e) => updateForm({ contact: { ...form.contact, phone: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={form.contact.whatsapp ?? ""}
                    onChange={(e) => updateForm({ contact: { ...form.contact, whatsapp: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={form.contact.website ?? ""}
                    onChange={(e) => updateForm({ contact: { ...form.contact, website: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={form.contact.email ?? ""}
                    onChange={(e) => updateForm({ contact: { ...form.contact, email: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Google Maps URL</Label>
                  <Input
                    value={form.contact.googleMapsUrl ?? ""}
                    onChange={(e) => updateForm({ contact: { ...form.contact, googleMapsUrl: e.target.value } })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input
                    value={form.social.facebook ?? ""}
                    onChange={(e) => updateForm({ social: { ...form.social, facebook: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input
                    value={form.social.instagram ?? ""}
                    onChange={(e) => updateForm({ social: { ...form.social, instagram: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>TikTok</Label>
                  <Input
                    value={form.social.tiktok ?? ""}
                    onChange={(e) => updateForm({ social: { ...form.social, tiktok: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter</Label>
                  <Input
                    value={form.social.twitter ?? ""}
                    onChange={(e) => updateForm({ social: { ...form.social, twitter: e.target.value } })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المنيو</CardTitle>
              <CardDescription>التحكم في الأقسام، الترتيب، والاستيراد.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>تعطيل أقسام (IDs مفصولة بفاصلة)</Label>
                  <Input
                    value={formatList(form.menuSettings.disabledCategories)}
                    onChange={(e) =>
                      updateForm({
                        menuSettings: {
                          ...form.menuSettings,
                          disabledCategories: parseList(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>ترتيب الأقسام (IDs مفصولة بفاصلة)</Label>
                  <Input
                    value={formatList(form.menuSettings.categoryOrder)}
                    onChange={(e) =>
                      updateForm({
                        menuSettings: {
                          ...form.menuSettings,
                          categoryOrder: parseList(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>نص غير متاح</Label>
                  <Input
                    value={form.menuSettings.unavailableLabel ?? ""}
                    onChange={(e) =>
                      updateForm({ menuSettings: { ...form.menuSettings, unavailableLabel: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>نص نفد</Label>
                  <Input
                    value={form.menuSettings.soldOutLabel ?? ""}
                    onChange={(e) =>
                      updateForm({ menuSettings: { ...form.menuSettings, soldOutLabel: e.target.value } })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">ربط صور للأصناف</p>
                  <p className="text-xs text-slate-500">عند تفعيلها يتم عرض صور الأصناف في المنيو.</p>
                </div>
                <Switch
                  checked={form.menuSettings.itemsImagesEnabled ?? true}
                  onCheckedChange={(value) =>
                    updateForm({ menuSettings: { ...form.menuSettings, itemsImagesEnabled: value } })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Import / Export JSON</Label>
                <Textarea
                  value={menuJson}
                  onChange={(e) => setMenuJson(e.target.value)}
                  placeholder="ضع إعدادات JSON هنا"
                  rows={5}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMenuJson(JSON.stringify(form.menuSettings ?? {}, null, 2))}
                  >
                    تصدير JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(menuJson || "{}")
                        updateForm({ menuSettings: { ...form.menuSettings, ...parsed } })
                        toast({ title: "تم استيراد الإعدادات" })
                      } catch {
                        toast({ title: "JSON غير صالح", variant: "destructive" })
                      }
                    }}
                  >
                    استيراد JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle>النشر والظهور</CardTitle>
              <CardDescription>تحكم في حالة الظهور في التطبيق.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">تفعيل الظهور</p>
                  <p className="text-xs text-slate-500">إيقافه سيخفي المتجر من الواجهة.</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(value) => updateForm({ isActive: value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">مميز (Featured)</p>
                  <p className="text-xs text-slate-500">تفعيل الظهور في الأقسام المميزة.</p>
                </div>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(value) => updateForm({ featured: value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Input
                  value={form.status}
                  onChange={(e) => updateForm({ status: e.target.value as SettingsForm["status"] })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
