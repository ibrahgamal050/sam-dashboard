"use client"
import useSWR, { mutate } from 'swr'
import { useMemo, useState } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StatusEnum, PaymentStatusEnum, PaymentMethodEnum } from '@/lib/orderEnums'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Row = {
  orderId: string
  createdAt: string
  totalPrice: number
  status?: string
  paymentStatus?: string
  paymentMethod?: string
}

export default function OrdersPage() {
  const [status, setStatus] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const params = new URLSearchParams()
  const rid = typeof window !== 'undefined' ? (document.cookie.match(/(?:^|; )restaurantId=([^;]+)/)?.[1] || '') : ''
  if (rid) params.set('restaurantId', rid)
  if (status) params.set('status', status)
  if (paymentStatus) params.set('paymentStatus', paymentStatus)
  if (paymentMethod) params.set('paymentMethod', paymentMethod)
  const { data, isLoading } = useSWR(`/api/orders?${params.toString()}`, fetcher)
  const rows: Row[] = data?.orders || []
  const view = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => !q || r.orderId.toLowerCase().includes(q))
  }, [rows, query])

  async function patchOne(id: string, changes: Partial<Row>) {
    const prev = data
    mutate(`/api/orders?${params.toString()}`,(current:any)=>({ ...current, orders: (current.orders||[]).map((o:any)=> o.orderId===id?{...o, ...changes}:o)}), false)
    const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json','x-restaurant-id': rid }, body: JSON.stringify(changes) })
    if (!res.ok) mutate(`/api/orders?${params.toString()}`, prev, false)
    else mutate(`/api/orders?${params.toString()}`)
  }

  async function bulkApply() {
    const ids = Array.from(selected)
    const changes: any = {}
    if (status) changes.status = status
    if (paymentStatus) changes.paymentStatus = paymentStatus
    if (paymentMethod) changes.paymentMethod = paymentMethod
    const res = await fetch(`/api/orders/bulk`, { method: 'PATCH', headers: { 'Content-Type': 'application/json','x-restaurant-id': rid }, body: JSON.stringify({ ids, changes }) })
    if (res.ok) { setSelected(new Set()); mutate(`/api/orders?${params.toString()}`) }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-3">
      <div className="flex gap-2 items-center">
        <Input placeholder="Search by orderId" value={query} onChange={(e)=>setQuery(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {StatusEnum.options.map((s)=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Payment Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {PaymentStatusEnum.options.map((s)=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Payment Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {PaymentMethodEnum.options.map((s)=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {selected.size>0 && (
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline">{selected.size} selected</Badge>
            <Button onClick={bulkApply}>Apply</Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="sticky left-0 bg-background p-3 border-b"><input type="checkbox" onChange={(e)=>{
                    const all = new Set<string>()
                    if (e.target.checked) view.forEach((r)=>all.add(r.orderId))
                    setSelected(all)
                  }} /></th>
                  <th className="p-3 border-b">Order</th>
                  <th className="p-3 border-b">Created</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Payment Status</th>
                  <th className="p-3 border-b">Payment Method</th>
                  <th className="p-3 border-b">Total</th>
                </tr>
              </thead>
              <tbody>
                {view.map((r)=> (
                  <tr key={r.orderId} className="text-sm">
                    <td className="sticky left-0 bg-background p-3 border-b">
                      <input type="checkbox" checked={selected.has(r.orderId)} onChange={(e)=>{
                        const s = new Set(selected)
                        if (e.target.checked) s.add(r.orderId); else s.delete(r.orderId)
                        setSelected(s)
                      }} />
                    </td>
                    <td className="p-3 border-b font-medium">{r.orderId}</td>
                    <td className="p-3 border-b">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
                    <td className="p-3 border-b">
                      <Select value={r.status || ''} onValueChange={(v)=>patchOne(r.orderId, { status: v })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>{StatusEnum.options.map((s)=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 border-b">
                      <Select value={r.paymentStatus || ''} onValueChange={(v)=>patchOne(r.orderId, { paymentStatus: v })}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>{PaymentStatusEnum.options.map((s)=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 border-b">
                      <Select value={r.paymentMethod || ''} onValueChange={(v)=>patchOne(r.orderId, { paymentMethod: v })}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>{PaymentMethodEnum.options.map((s)=> <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 border-b">{r.totalPrice?.toFixed ? r.totalPrice.toFixed(2) : r.totalPrice}</td>
                  </tr>
                ))}
                {view.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

