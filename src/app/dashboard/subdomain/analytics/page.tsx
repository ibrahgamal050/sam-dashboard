"use client"

import { useMemo, useState } from "react"
import { CalendarRange, DollarSign, RefreshCw, Users } from "lucide-react"

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
import { Input } from "@/components/ui/input"

const SUMMARY_METRICS = [
  {
    label: "Общая выручка",
    value: "362,450 ₽",
    change: "+12.4% по сравнению с прошлым месяцем",
    icon: DollarSign,
  },
  {
    label: "Заказы",
    value: "1,284",
    change: "+8.1% по сравнению с прошлым месяцем",
    icon: RefreshCw,
  },
  {
    label: "Активные клиенты",
    value: "742",
    change: "+5.6% по сравнению с прошлым месяцем",
    icon: Users,
  },
  {
    label: "Средний чек",
    value: "282.5 ₽",
    change: "+3.2% по сравнению с прошлым месяцем",
    icon: CalendarRange,
  },
]

const TOP_ITEMS = [
  { id: "IT-041", name: "Ассорти гриль", orders: 182, revenue: "42,360 ₽" },
  { id: "IT-023", name: "Шаурма с курицей", orders: 156, revenue: "28,704 ₽" },
  { id: "IT-015", name: "Паэлья с морепродуктами", orders: 96, revenue: "31,680 ₽" },
  { id: "IT-067", name: "Рэп с фалафелем", orders: 221, revenue: "19,890 ₽" },
]

const BRANCH_PERFORMANCE = [
  { branch: "Маади", orders: 542, revenue: "126,900 ₽", growth: "+9%" },
  { branch: "Мединет Наср", orders: 318, revenue: "83,240 ₽", growth: "+5%" },
  { branch: "6 Октября", orders: 198, revenue: "46,880 ₽", growth: "+4%" },
]

export default function AnalyticsDashboard() {
  const [range, setRange] = useState("Последние 30 дней")

  const activeMetrics = useMemo(() => SUMMARY_METRICS, [])

  return (
    <section className="space-y-6 text-right">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row-reverse sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">التحليلات</h1>
          <p className="text-sm text-slate-500">مؤشرات الأداء الرئيسية للطلبات والإيرادات وتفاعل العملاء.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="h-10 w-40 rounded-full border-slate-300 text-sm text-right"
          />
          <Button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            تصدير التقرير
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {activeMetrics.map((metric) => (
          <Card key={metric.label} className="border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{metric.label}</CardTitle>
              <metric.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{metric.value}</div>
              <p className="mt-1 text-xs text-emerald-500">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">أفضل عناصر المنيو</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 text-right">معرّف الصنف</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الطلبات</TableHead>
                  <TableHead className="text-right">الإيرادات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TOP_ITEMS.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-slate-900">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right text-slate-600">{item.orders}</TableCell>
                    <TableCell className="text-right font-medium text-slate-900">{item.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">أداء الفروع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {BRANCH_PERFORMANCE.map((branch) => (
              <div key={branch.branch} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{branch.branch}</span>
                  <span className="text-xs text-emerald-500">{branch.growth}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{branch.orders} заказов</span>
                  <span className="font-medium text-slate-900">{branch.revenue}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
