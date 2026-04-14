import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowUpLeft,
  ClipboardList,
  LayoutGrid,
  MapPinned,
  Package,
  Settings,
  ShoppingBasket,
  Store,
  Truck,
} from "lucide-react"

import dbConnect from "@/lib/dbConnect"
import CatalogProduct from "@/models/CatalogProduct"
import MerchantProduct from "@/models/MerchantProduct"
import RetailOrder from "@/models/RetailOrder"
import SupermarketCategories from "@/models/Category"
import SuperMarket from "@/models/SuperMarket"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type PageProps = {
  params: Promise<{ slug: string }>
}

type LocalizedValue = { ar?: string; en?: string } | string | null | undefined

const pickLocalized = (value: LocalizedValue) => {
  if (!value) return ""
  if (typeof value === "string") return value
  return value.ar || value.en || ""
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value)

const formatDateTime = (value?: Date | string | null) => {
  if (!value) return "-"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  preparing: "جاري التحضير",
  out_for_delivery: "خرج للتوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
}

const ORDER_STATUS_CLASSNAMES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-sky-200 bg-sky-50 text-sky-700",
  preparing: "border-violet-200 bg-violet-50 text-violet-700",
  out_for_delivery: "border-blue-200 bg-blue-50 text-blue-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
}

type CategoryNode = {
  id?: string
  subCategories?: CategoryNode[]
}

const countNodes = (nodes: CategoryNode[] = []): number =>
  nodes.reduce((sum, node) => sum + 1 + countNodes(node.subCategories || []), 0)

export default async function SupermarketDashboardPage({ params }: PageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug || "").trim().toLowerCase()
  if (!decodedSlug) notFound()

  await dbConnect()

  const supermarket = await SuperMarket.findOne({ slug: decodedSlug }).lean()
  if (!supermarket) notFound()

  const [
    merchantProducts,
    catalogProducts,
    categoriesDoc,
    recentOrders,
  ] = await Promise.all([
    MerchantProduct.find({ merchantId: supermarket._id })
      .select("price offerPrice available stock isActive createdAt updatedAt")
      .lean(),
    CatalogProduct.find({ supermarketId: supermarket._id })
      .select("isActive createdAt updatedAt")
      .lean(),
    SupermarketCategories.findOne({ supermarketId: supermarket._id, isActive: true })
      .select("categories")
      .lean(),
    RetailOrder.find({ branchId: supermarket._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("status payableTotal itemsTotal deliveryFee paymentMethod createdAt items")
      .lean(),
  ])

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const supermarketName =
    pickLocalized((supermarket as any).nameAr) ||
    pickLocalized((supermarket as any).nameEn) ||
    pickLocalized((supermarket as any).name) ||
    supermarket.slug

  const availableMerchantProducts = merchantProducts.filter((item: any) => item.available)
  const lowStockProducts = merchantProducts.filter(
    (item: any) => typeof item.stock === "number" && item.stock > 0 && item.stock <= 5,
  )
  const activeCatalogProducts = catalogProducts.filter((item: any) => item.isActive)
  const todayOrders = recentOrders.filter((order: any) => new Date(order.createdAt) >= startOfToday)
  const todayRevenue = todayOrders
    .filter((order: any) => order.status !== "cancelled")
    .reduce((sum: number, order: any) => sum + Number(order.payableTotal || 0), 0)
  const activeOrdersCount = recentOrders.filter(
    (order: any) => !["delivered", "cancelled"].includes(String(order.status)),
  ).length
  const averageBasket = todayOrders.length ? Math.round(todayRevenue / todayOrders.length) : 0
  const categoriesCount = countNodes(((categoriesDoc as any)?.categories || []) as CategoryNode[])

  const deliverySettings = supermarket.orderSettings?.delivery
  const fallbackDelivery = supermarket.delivery
  const deliveryFee = Number(deliverySettings?.fee ?? fallbackDelivery?.fee ?? 0)
  const minOrder = Number(deliverySettings?.minOrder ?? fallbackDelivery?.minOrder ?? 0)
  const etaMin = Number(deliverySettings?.etaMin ?? fallbackDelivery?.etaMin ?? 0)
  const etaMax = Number(deliverySettings?.etaMax ?? fallbackDelivery?.etaMax ?? 0)
  const deliveryEnabled = Boolean(deliverySettings?.enabled ?? fallbackDelivery?.enabled ?? true)
  const pickupEnabled = Boolean(supermarket.orderSettings?.pickup?.enabled ?? true)
  const cashEnabled = Boolean(supermarket.orderSettings?.payment?.cashOnDelivery ?? true)
  const onlineEnabled = Boolean(supermarket.orderSettings?.payment?.onlinePayment ?? false)
  const whatsapp = supermarket.contact?.whatsapp || supermarket.contact?.phone || "-"

  const quickActions = [
    {
      title: "الكتالوج",
      description: "إدارة الأقسام والمنتجات الظاهرة للعميل",
      href: `/dashboard/supermarket/${supermarket.slug}/retail`,
      icon: LayoutGrid,
    },
    {
      title: "الطلبات",
      description: "مراجعة الطلبات وتحديث حالاتها",
      href: `/dashboard/supermarket/${supermarket.slug}/orders`,
      icon: ClipboardList,
    },
    {
      title: "مناطق التوصيل",
      description: "الرسوم والحد الأدنى ومناطق الخدمة",
      href: `/dashboard/supermarket/${supermarket.slug}/delivery-zones`,
      icon: MapPinned,
    },
    {
      title: "الإعدادات",
      description: "معلومات المتجر والدفع وبيانات التواصل",
      href: `/dashboard/supermarket/${supermarket.slug}/settings`,
      icon: Settings,
    },
  ]

  return (
    <section className="space-y-6 text-right">
      <Card className="overflow-hidden rounded-3xl border-[#d9ecff] bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-[#eef6ff] px-3 py-1 text-[#2f7fb2] hover:bg-[#eef6ff]">
                {supermarket.brandType === "dark_store" ? "دارك ستور" : "سوبرماركت"}
              </Badge>
              <Badge
                variant="outline"
                className={supermarket.status === "published" ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}
              >
                {supermarket.status === "published" ? "منشور" : "غير منشور"}
              </Badge>
              <Badge
                variant="outline"
                className={supermarket.isActive ? "border-sky-200 text-sky-700" : "border-slate-200 text-slate-500"}
              >
                {supermarket.isActive ? "نشط" : "متوقف"}
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{supermarketName}</h1>
              <p className="text-sm text-muted-foreground">{supermarket.slug}</p>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                {supermarket.description || "لوحة تشغيل السوبرماركت مع مؤشرات المنتجات والطلبات وإعدادات التوصيل."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-2xl border border-[#d9ecff] bg-[#f8fbff] p-4 transition hover:-translate-y-0.5 hover:border-[#b8dcff] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{action.title}</p>
                      <p className="text-xs leading-6 text-slate-500">{action.description}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#2f7fb2] shadow-sm">
                      <action.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2f7fb2]">
                    فتح القسم
                    <ArrowUpLeft className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-[#d9ecff] bg-[#f8fbff] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2f7fb2] shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">بيانات المتجر</p>
                <p className="text-xs text-slate-500">ملخص سريع للتشغيل الحالي</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-slate-500">العنوان</span>
                <span className="font-medium text-slate-900">{supermarket.address || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-slate-500">واتساب / هاتف</span>
                <span className="font-medium text-slate-900">{whatsapp}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-slate-500">آخر تحديث</span>
                <span className="font-medium text-slate-900">{formatDateTime(supermarket.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-slate-500">الطلبات النشطة</span>
                <span className="font-medium text-slate-900">{activeOrdersCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">إجمالي منتجات التاجر</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{merchantProducts.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">منتجات معروضة في الكتالوج</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{activeCatalogProducts.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
              <LayoutGrid className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">طلبات اليوم</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{todayOrders.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
              <ShoppingBasket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">مبيعات اليوم</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatMoney(todayRevenue)} ج</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl">أحدث الطلبات</CardTitle>
              <CardDescription>آخر الطلبات المسجلة على هذا السوبرماركت.</CardDescription>
            </div>
            <Button asChild variant="outline" className="rounded-full border-[#cfe6ff] text-[#256a9a] hover:bg-[#edf6ff]">
              <Link href={`/dashboard/supermarket/${supermarket.slug}/orders`}>عرض كل الطلبات</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9ecff] bg-[#f8fbff] px-6 py-12 text-center text-sm text-slate-500">
                لا توجد طلبات مسجلة لهذا السوبرماركت حتى الآن.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#d9ecff]/80">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#eef6ff]">
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">العناصر</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order: any) => (
                      <TableRow key={String(order._id)}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={ORDER_STATUS_CLASSNAMES[String(order.status)] || "border-slate-200 text-slate-600"}
                          >
                            {ORDER_STATUS_LABELS[String(order.status)] || String(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {formatMoney(Number(order.payableTotal || 0))} ج
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {Array.isArray(order.items) ? order.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) : 0}
                        </TableCell>
                        <TableCell className="text-slate-500">{formatDateTime(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">التشغيل والتوصيل</CardTitle>
              <CardDescription>القيم الفعلية المستخرجة من إعدادات المتجر الحالية.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">التوصيل</span>
                <span className="font-semibold text-slate-900">{deliveryEnabled ? "مفعل" : "متوقف"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">رسوم التوصيل</span>
                <span className="font-semibold text-slate-900">{formatMoney(deliveryFee)} ج</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">الحد الأدنى للطلب</span>
                <span className="font-semibold text-slate-900">{formatMoney(minOrder)} ج</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">الوقت المتوقع</span>
                <span className="font-semibold text-slate-900">
                  {etaMin || etaMax ? `${etaMin || 0} - ${etaMax || etaMin || 0} دقيقة` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">الاستلام من الفرع</span>
                <span className="font-semibold text-slate-900">{pickupEnabled ? "مفعل" : "متوقف"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">طرق الدفع</span>
                <span className="font-semibold text-slate-900">
                  {[cashEnabled ? "نقدي" : null, onlineEnabled ? "أونلاين" : null].filter(Boolean).join(" / ") || "-"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">تنبيهات سريعة</CardTitle>
              <CardDescription>مؤشرات تشغيلية مبنية على البيانات الحالية.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-[#d9ecff] px-4 py-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Package className="h-4 w-4 text-[#2f7fb2]" />
                  <span>منتجات منخفضة المخزون</span>
                </div>
                <span className="font-bold text-slate-900">{lowStockProducts.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#d9ecff] px-4 py-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Truck className="h-4 w-4 text-[#2f7fb2]" />
                  <span>طلبات نشطة</span>
                </div>
                <span className="font-bold text-slate-900">{activeOrdersCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#d9ecff] px-4 py-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <LayoutGrid className="h-4 w-4 text-[#2f7fb2]" />
                  <span>إجمالي الأقسام والفروع</span>
                </div>
                <span className="font-bold text-slate-900">{categoriesCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#d9ecff] px-4 py-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <ShoppingBasket className="h-4 w-4 text-[#2f7fb2]" />
                  <span>متوسط سلة اليوم</span>
                </div>
                <span className="font-bold text-slate-900">{todayOrders.length ? `${formatMoney(averageBasket)} ج` : "-"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#d9ecff] px-4 py-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Package className="h-4 w-4 text-[#2f7fb2]" />
                  <span>منتجات متاحة للبيع</span>
                </div>
                <span className="font-bold text-slate-900">{availableMerchantProducts.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
