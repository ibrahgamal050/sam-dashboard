import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowUpLeft,
  BarChart3,
  ClipboardList,
  Package,
  ShoppingBasket,
  Store,
  Truck,
} from "lucide-react"

import dbConnect from "@/lib/dbConnect"
import CatalogProduct from "@/models/CatalogProduct"
import MerchantProduct from "@/models/MerchantProduct"
import RetailOrder from "@/models/RetailOrder"
import SuperMarket from "@/models/SuperMarket"
import { Badge } from "@/components/ui/badge"
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

type RetailOrderLean = {
  status?: string
  paymentMethod?: string
  payableTotal?: number
  deliveryFee?: number
  createdAt?: Date | string
  userId?: string | null
  items?: Array<{
    productId?: string
    name?: string
    quantity?: number
    subtotal?: number
  }>
}

const pickLocalized = (value: LocalizedValue) => {
  if (!value) return ""
  if (typeof value === "string") return value
  return value.ar || value.en || ""
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value)

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value)

const formatPercent = (value: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 }).format(value)

const formatDayLabel = (value: Date) =>
  new Intl.DateTimeFormat("ar-EG", { weekday: "short", day: "numeric", month: "short" }).format(value)

const changeLabel = (current: number, previous: number) => {
  if (previous <= 0) {
    return current > 0 ? "نشاط جديد مقارنة بالفترة السابقة" : "بدون تغير عن الفترة السابقة"
  }

  const percentage = ((current - previous) / previous) * 100
  const prefix = percentage > 0 ? "+" : ""
  return `${prefix}${formatPercent(percentage)}% مقارنة بالفترة السابقة`
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

const startOfDay = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const subtractDays = (value: Date, days: number) => {
  const next = new Date(value)
  next.setDate(next.getDate() - days)
  return next
}

export default async function SupermarketAnalyticsPage({ params }: PageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug || "").trim().toLowerCase()
  if (!decodedSlug) notFound()

  await dbConnect()

  const supermarket = await SuperMarket.findOne({ slug: decodedSlug }).lean()
  if (!supermarket) notFound()

  const now = new Date()
  const todayStart = startOfDay(now)
  const currentPeriodStart = subtractDays(todayStart, 29)
  const previousPeriodStart = subtractDays(currentPeriodStart, 30)

  const [merchantProducts, catalogProducts, ordersWindow] = await Promise.all([
    MerchantProduct.find({ merchantId: supermarket._id })
      .select("stock available isActive updatedAt")
      .lean(),
    CatalogProduct.find({ supermarketId: supermarket._id })
      .select("isActive updatedAt")
      .lean(),
    RetailOrder.find({
      branchId: supermarket._id,
      createdAt: { $gte: previousPeriodStart },
    })
      .select("status paymentMethod payableTotal deliveryFee createdAt userId items")
      .lean<RetailOrderLean[]>(),
  ])

  const supermarketName =
    pickLocalized((supermarket as any).nameAr) ||
    pickLocalized((supermarket as any).nameEn) ||
    pickLocalized((supermarket as any).name) ||
    supermarket.slug

  const currentOrders = ordersWindow.filter((order) => {
    const createdAt = order.createdAt ? new Date(order.createdAt) : null
    return createdAt && createdAt >= currentPeriodStart
  })
  const previousOrders = ordersWindow.filter((order) => {
    const createdAt = order.createdAt ? new Date(order.createdAt) : null
    return createdAt && createdAt >= previousPeriodStart && createdAt < currentPeriodStart
  })

  const nonCancelledCurrentOrders = currentOrders.filter((order) => order.status !== "cancelled")
  const nonCancelledPreviousOrders = previousOrders.filter((order) => order.status !== "cancelled")

  const currentRevenue = nonCancelledCurrentOrders.reduce(
    (sum, order) => sum + Number(order.payableTotal || 0),
    0,
  )
  const previousRevenue = nonCancelledPreviousOrders.reduce(
    (sum, order) => sum + Number(order.payableTotal || 0),
    0,
  )
  const currentAverageBasket = nonCancelledCurrentOrders.length
    ? currentRevenue / nonCancelledCurrentOrders.length
    : 0
  const previousAverageBasket = nonCancelledPreviousOrders.length
    ? previousRevenue / nonCancelledPreviousOrders.length
    : 0

  const cancelledCurrentOrders = currentOrders.filter((order) => order.status === "cancelled")
  const cancelledPreviousOrders = previousOrders.filter((order) => order.status === "cancelled")

  const activeOrders = currentOrders.filter(
    (order) => !["delivered", "cancelled"].includes(String(order.status || "")),
  ).length
  const currentDeliveryFees = nonCancelledCurrentOrders.reduce(
    (sum, order) => sum + Number(order.deliveryFee || 0),
    0,
  )

  const currentCustomers = new Set(
    currentOrders
      .map((order) => String(order.userId || "").trim())
      .filter((value) => value.length > 0),
  ).size

  const dailyRows = Array.from({ length: 7 }, (_, index) => {
    const date = subtractDays(todayStart, 6 - index)
    const nextDate = subtractDays(date, -1)
    const dayOrders = currentOrders.filter((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null
      return createdAt && createdAt >= date && createdAt < nextDate
    })
    const revenue = dayOrders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.payableTotal || 0), 0)

    return {
      label: formatDayLabel(date),
      orders: dayOrders.length,
      revenue,
      averageOrder: dayOrders.length ? revenue / dayOrders.length : 0,
    }
  })

  const topItemsMap = new Map<
    string,
    { name: string; quantity: number; revenue: number; orders: number }
  >()

  nonCancelledCurrentOrders.forEach((order) => {
    const seenItemsInOrder = new Set<string>()
    ;(order.items || []).forEach((item) => {
      const key = String(item.productId || item.name || "").trim()
      if (!key) return

      const existing = topItemsMap.get(key) || {
        name: item.name || "منتج بدون اسم",
        quantity: 0,
        revenue: 0,
        orders: 0,
      }

      existing.quantity += Number(item.quantity || 0)
      existing.revenue += Number(item.subtotal || 0)
      if (!seenItemsInOrder.has(key)) {
        existing.orders += 1
        seenItemsInOrder.add(key)
      }

      topItemsMap.set(key, existing)
    })
  })

  const topItems = Array.from(topItemsMap.values())
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 6)

  const statusRows = Object.entries(
    currentOrders.reduce<Record<string, number>>((acc, order) => {
      const status = String(order.status || "pending")
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}),
  )
    .map(([status, count]) => ({
      status,
      label: ORDER_STATUS_LABELS[status] || status,
      count,
      ratio: currentOrders.length ? (count / currentOrders.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  const paymentRows = Object.entries(
    nonCancelledCurrentOrders.reduce<Record<string, number>>((acc, order) => {
      const paymentMethod = String(order.paymentMethod || "cash")
      acc[paymentMethod] = (acc[paymentMethod] || 0) + 1
      return acc
    }, {}),
  ).map(([paymentMethod, count]) => ({
    paymentMethod,
    label:
      paymentMethod === "card"
        ? "بطاقة"
        : paymentMethod === "wallet"
          ? "محفظة"
          : "نقدًا عند الاستلام",
    count,
  }))

  const availableMerchantProducts = merchantProducts.filter((item: any) => item.available)
  const lowStockProducts = merchantProducts.filter(
    (item: any) => typeof item.stock === "number" && item.stock > 0 && item.stock <= 5,
  )
  const activeCatalogProducts = catalogProducts.filter((item: any) => item.isActive)

  const summaryMetrics = [
    {
      title: "مبيعات آخر 30 يوم",
      value: `${formatMoney(currentRevenue)} ج`,
      subtitle: changeLabel(currentRevenue, previousRevenue),
      icon: BarChart3,
    },
    {
      title: "طلبات آخر 30 يوم",
      value: formatNumber(currentOrders.length),
      subtitle: changeLabel(currentOrders.length, previousOrders.length),
      icon: ShoppingBasket,
    },
    {
      title: "متوسط قيمة الطلب",
      value: `${formatMoney(Math.round(currentAverageBasket))} ج`,
      subtitle: changeLabel(currentAverageBasket, previousAverageBasket),
      icon: ClipboardList,
    },
    {
      title: "الطلبات الملغاة",
      value: formatNumber(cancelledCurrentOrders.length),
      subtitle: changeLabel(cancelledCurrentOrders.length, cancelledPreviousOrders.length),
      icon: Truck,
    },
  ]

  return (
    <section className="space-y-6 text-right">
      <Card className="overflow-hidden rounded-3xl border-[#d9ecff] bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-[#eef6ff] px-3 py-1 text-[#2f7fb2] hover:bg-[#eef6ff]">
                تحليلات السوبرماركت
              </Badge>
              <Badge
                variant="outline"
                className={supermarket.status === "published" ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}
              >
                {supermarket.status === "published" ? "منشور" : "غير منشور"}
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{supermarketName}</h1>
              <p className="text-sm text-slate-500">قراءة تشغيلية حقيقية لآخر 30 يوم من الطلبات والمنتجات.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                href={`/dashboard/supermarket/${supermarket.slug}/orders`}
                className="group rounded-2xl border border-[#d9ecff] bg-[#f8fbff] p-4 transition hover:-translate-y-0.5 hover:border-[#b8dcff] hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">الطلبات</p>
                    <p className="text-xs leading-6 text-slate-500">مراجعة الطلبات وتحديث الحالات.</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#2f7fb2] shadow-sm">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2f7fb2]">
                  فتح الطلبات
                  <ArrowUpLeft className="h-3.5 w-3.5" />
                </div>
              </Link>

              <Link
                href={`/dashboard/supermarket/${supermarket.slug}/retail`}
                className="group rounded-2xl border border-[#d9ecff] bg-[#f8fbff] p-4 transition hover:-translate-y-0.5 hover:border-[#b8dcff] hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">الكتالوج</p>
                    <p className="text-xs leading-6 text-slate-500">مراجعة التوفر والمخزون المعروض.</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#2f7fb2] shadow-sm">
                    <Package className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2f7fb2]">
                  فتح الكتالوج
                  <ArrowUpLeft className="h-3.5 w-3.5" />
                </div>
              </Link>

              <div className="rounded-2xl border border-[#d9ecff] bg-[#f8fbff] p-4">
                <p className="text-sm text-slate-500">عدد العملاء المعروفين</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{formatNumber(currentCustomers)}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">عدد المستخدمين المسجلين الذين نفذوا طلبًا خلال الفترة.</p>
              </div>

              <div className="rounded-2xl border border-[#d9ecff] bg-[#f8fbff] p-4">
                <p className="text-sm text-slate-500">رسوم التوصيل المحصلة</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{formatMoney(currentDeliveryFees)} ج</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">إجمالي رسوم التوصيل في الطلبات غير الملغاة خلال آخر 30 يوم.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-[#d9ecff] bg-[#f8fbff] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2f7fb2] shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">ملخص التشغيل</p>
                <p className="text-xs text-slate-500">أهم النقاط التي تحتاج متابعة الآن</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-slate-500">طلبات نشطة الآن</span>
                <span className="font-medium text-slate-900">{formatNumber(activeOrders)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-slate-500">منتجات التاجر المتاحة</span>
                <span className="font-medium text-slate-900">
                  {formatNumber(availableMerchantProducts.length)} / {formatNumber(merchantProducts.length)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-slate-500">منخفضة المخزون</span>
                <span className="font-medium text-slate-900">{formatNumber(lowStockProducts.length)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span className="text-slate-500">منتجات نشطة في الكتالوج</span>
                <span className="font-medium text-slate-900">{formatNumber(activeCatalogProducts.length)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <Card key={metric.title} className="rounded-3xl border-[#d9ecff] bg-white/90">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{metric.title}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-500">{metric.subtitle}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2f7fb2]">
                <metric.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">أفضل المنتجات خلال آخر 30 يوم</CardTitle>
            <CardDescription>مرتبة حسب إجمالي الكمية المباعة ثم الإيراد.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الطلبات</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">الإيراد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.length ? (
                  topItems.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.orders)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {formatMoney(item.revenue)} ج
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-slate-500">
                      لا توجد طلبات كافية لعرض أفضل المنتجات.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">توزيع حالات الطلب</CardTitle>
            <CardDescription>كل الحالات المسجلة خلال آخر 30 يوم.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusRows.length ? (
              statusRows.map((row) => (
                <div key={row.status} className="rounded-2xl border border-[#d9ecff] bg-[#f8fbff] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      variant="outline"
                      className={ORDER_STATUS_CLASSNAMES[row.status] || "border-slate-200 text-slate-600"}
                    >
                      {row.label}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-900">{formatNumber(row.count)} طلب</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {formatPercent(row.ratio)}% من إجمالي طلبات الفترة
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d9ecff] px-4 py-8 text-center text-sm text-slate-500">
                لا توجد طلبات في آخر 30 يوم.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">أداء آخر 7 أيام</CardTitle>
            <CardDescription>عدد الطلبات والإيراد ومتوسط السلة لكل يوم.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اليوم</TableHead>
                  <TableHead className="text-right">الطلبات</TableHead>
                  <TableHead className="text-right">الإيراد</TableHead>
                  <TableHead className="text-right">متوسط الطلب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium text-slate-900">{row.label}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.orders)}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.revenue)} ج</TableCell>
                    <TableCell className="text-right">{formatMoney(Math.round(row.averageOrder))} ج</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9ecff] bg-white/90">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">قنوات الدفع</CardTitle>
            <CardDescription>توزيع وسائل الدفع للطلبات غير الملغاة خلال الفترة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentRows.length ? (
              paymentRows.map((row) => (
                <div key={row.paymentMethod} className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className="font-medium text-slate-900">{formatNumber(row.count)} طلب</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d9ecff] px-4 py-8 text-center text-sm text-slate-500">
                لا توجد بيانات دفع كافية في الفترة الحالية.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
