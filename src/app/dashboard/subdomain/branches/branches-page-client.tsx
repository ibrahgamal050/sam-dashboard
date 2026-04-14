"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { MapPin, Pencil, Phone, Plus, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

type BranchesPageClientProps = {
  subdomain: string
}

export default function BranchesPageClient({ subdomain }: BranchesPageClientProps) {
  const [q, setQ] = useState("")
  const { data, isLoading, mutate } = useSWR(
    `/api/${subdomain}/branches?q=${encodeURIComponent(q)}&limit=50`,
    fetcher
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">الفروع</h1>
        <Link href={`/dashboard/${subdomain}/branches/new`}>
          <Button><Plus className="w-4 h-4 mr-2" /> إضافة فرع</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="ابحث بالاسم أو العنوان..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button variant="secondary" onClick={() => mutate()}>بحث</Button>
      </div>

      {isLoading ? (
        <p>جارِ التحميل…</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items?.map((b: any) => (
            <div key={b._id} className={cn("p-4 rounded-2xl border shadow-sm", !b.isActive && "opacity-70")}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">
                  {b.name} {b.isMain && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100">الفرع الرئيسي</span>}
                </div>
                <Link href={`/dashboard/${subdomain}/branches/${b._id}`}>
                  <Button size="sm" variant="outline"><Pencil className="w-4 h-4" /></Button>
                </Link>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {b.address?.line1}</div>
                {b.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {b.phone}</div>}
              </div>
              <div className="mt-3">
                <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded",
                  b.isActive ? "bg-green-100" : "bg-zinc-200")}>
                  <Power className="w-3 h-3" /> {b.isActive ? "نشط" : "مُعطَّل"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
