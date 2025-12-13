'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Building, ExternalLink, Filter, Loader2, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type AccessibleRestaurant = {
  _id: string
  name: { ar: string; en: string }
  subdomain: string
  logo: string
  coverImage: string
  description: string
  isPublished: boolean
  phones: string[]
  updatedAt: string | null
  role: string | null
}

const ROLE_LABELS: Record<string, string> = {
  meelza_admin: 'Administrator',
  owner: 'Owner',
  staff: 'Staff',
}

const STATUS_LABELS = {
  published: { label: 'Published', variant: 'default' as const },
  draft: { label: 'Draft', variant: 'secondary' as const },
}

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'meelza.com'

export default function SitesPage() {
  const [sites, setSites] = useState<AccessibleRestaurant[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'meelza_admin' | 'owner' | 'staff'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/me/restaurants', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('Failed to load sites')
        }
        const payload = await res.json()
        setSites(payload.restaurants ?? [])
      } catch (err: any) {
        setError(err?.message || 'Unable to load your restaurants')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesSearch =
        site.name.en.toLowerCase().includes(search.toLowerCase()) ||
        site.name.ar.includes(search) ||
        site.subdomain.toLowerCase().includes(search.toLowerCase())

      const matchesRole = roleFilter === 'all' || site.role === roleFilter

      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'published' ? site.isPublished : !site.isPublished)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [sites, search, roleFilter, statusFilter])

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Sites</p>
          <h1 className="text-3xl font-semibold text-slate-900">إدارة المطاعم المرتبطة بحسابك</h1>
          <p className="text-sm text-slate-500">عرض كل المواقع التي تمتلك فيها دوراً والنقر للدخول إلى لوحة التحكم الخاصة بكل مطعم.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/dashboard/restaurants/new">إنشاء مطعم جديد</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ابحث بالإسم أو النطاق الفرعي"
            className="rounded-full pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as any)}>
            <SelectTrigger className="rounded-full">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="تصفية حسب الدور" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأدوار</SelectItem>
              <SelectItem value="meelza_admin">Administrator</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="حالة الموقع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
          <Building className="mb-3 h-10 w-10 text-slate-400" />
          <p className="text-lg font-semibold text-slate-700">لا توجد مطاعم مرتبطة بهذا الحساب</p>
          <p className="mt-1 text-sm">عندما يضيفك أحد كمالك أو عضو فريق سيظهر المطعم هنا.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.map((site) => (
            <Card key={site._id} className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
              <div className="relative h-40 w-full overflow-hidden rounded-b-none bg-gradient-to-br from-slate-50 to-slate-200">
                {site.coverImage ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(0deg,rgba(0,0,0,0.05),rgba(0,0,0,0.05)),url(${site.coverImage})` }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
                    {site.name.en
                      .split(' ')
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-indigo-500">
                      {site.role ? ROLE_LABELS[site.role] || site.role : 'No role assigned'}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{site.name.en}</h3>
                    <p className="text-xs text-slate-500">{site.subdomain}.{rootDomain}</p>
                  </div>
                  <Badge variant={site.isPublished ? STATUS_LABELS.published.variant : STATUS_LABELS.draft.variant}>
                    {site.isPublished ? STATUS_LABELS.published.label : STATUS_LABELS.draft.label}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{site.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {site.phones?.slice(0, 2).map((phone) => (
                    <Badge key={phone} variant="secondary" className="rounded-full">
                      {phone}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="flex-1 rounded-full">
                    <Link href={`/dashboard/${site.subdomain}`}>فتح لوحة التحكم</Link>
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full" asChild>
                    <a href={`https://${site.subdomain}.${rootDomain}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
