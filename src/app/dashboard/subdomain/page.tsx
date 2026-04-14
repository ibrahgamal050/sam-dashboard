'use client'
"use client"

import { useMemo } from "react"
import { ArrowUpRight, CalendarRange, RefreshCw, UtensilsCrossed } from "lucide-react"

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

const KPIS = [
  {
    label: "Today's orders",
    value: "128",
    change: "+18% vs yesterday",
  },
  {
    label: "Revenue",
    value: "24,860 EGP",
    change: "+12% vs yesterday",
  },
  {
    label: "Avg. preparation",
    value: "16 min",
    change: "-3 min better",
  },
]

const UPDATES = [
  {
    id: "UP-001",
    title: "New order from Maadi branch",
    meta: "8:45 AM • 186 EGP",
  },
  {
    id: "UP-002",
    title: "Inventory reminder: Chicken Shawarma",
    meta: "30 servings left",
  },
  {
    id: "UP-003",
    title: "3 deliveries approaching SLA",
    meta: "Check dispatch queue",
  },
]

const QUICK_TASKS = [
  "Review today's menu availability",
  "Check upcoming reservations",
  "Confirm staff schedule for dinner shift",
]

export default function RestaurantAdminDashboard() {
  const overview = useMemo(() => KPIS, [])

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Welcome back</h1>
          <p className="text-sm text-slate-500">Track today's performance, pending tasks, and quick actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full border-slate-300 text-sm text-slate-600">
            Today • 28 Jun 2024
          </Button>
          <Button className="gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            <CalendarRange className="h-4 w-4" />
            View calendar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {overview.map((kpi) => (
          <Card key={kpi.label} className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{kpi.value}</div>
              <p className="mt-2 text-xs text-emerald-500">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">Recent activity</CardTitle>
            <Button variant="ghost" className="gap-1 text-sm text-slate-600 hover:text-slate-900">
              View logs
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {UPDATES.map((update) => (
                  <TableRow key={update.id}>
                    <TableCell className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {update.id}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">{update.title}</TableCell>
                    <TableCell className="text-sm text-slate-500">{update.meta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Quick tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {QUICK_TASKS.map((task) => (
              <div key={task} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-start gap-3">
                  <UtensilsCrossed className="mt-0.5 h-4 w-4 text-blue-500" />
                  <p className="text-sm text-slate-700">{task}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full rounded-full border-slate-300 text-sm text-slate-600">
              View task center
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">Performance snapshot</CardTitle>
          <Button variant="ghost" className="gap-1 text-sm text-slate-600 hover:text-slate-900">
            Download CSV
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Ready to dispatch', value: '42 orders' },
            { label: 'Pending pick-up', value: '18 orders' },
            { label: 'Scheduled today', value: '24 orders' },
            { label: 'Driver on-route', value: '7 orders' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
