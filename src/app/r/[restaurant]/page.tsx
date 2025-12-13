"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export default function EntryPage() {
  const { rid } = useParams() as { rid?: string }
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [pin, setPin] = useState('')
  const [role, setRole] = useState<'kitchen'|'expo'|'cashier'>('kitchen')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!rid) return
      const r = await fetch(`/api/restaurants/${rid}`)
      if (r.ok) setRestaurant(await r.json())
    })()
  }, [rid])

  async function login() {
    setLoading(true)
    setError(null)
    try {
      const restaurantId = restaurant?._id
      if (!restaurantId) return
      const res = await fetch('/api/employees/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantId, pin }) })
      if (!res.ok) throw new Error('Auth failed')
      const data = await res.json()
      if (!data.ok) { setError('Invalid PIN'); setLoading(false); return }
      // store session hints for existing flows
      if (role === 'expo') localStorage.setItem('expo.restaurantId', restaurantId)
      if (role === 'kitchen') localStorage.setItem('expo.restaurantId', restaurantId)
      // redirect based on role
      if (role === 'kitchen') router.push(`/r/${rid}/kitchen`)
      else if (role === 'expo') router.push(`/r/${rid}/expo`)
      else router.push(`/r/${rid}/pos`)
    } catch (e) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            {restaurant?.logo && (
              <img src={restaurant.logo} alt={restaurant?.nameEn || 'Logo'} className="h-12 w-12 rounded-lg object-cover" />
            )}
            <div>
              <CardTitle className="text-2xl">{restaurant?.nameEn || 'Restaurant'}</CardTitle>
              <div className="text-sm text-muted-foreground">POS Login</div>
            </div>
            <div className="ml-auto">
              <Badge variant="outline">{rid}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(v)=>setRole(v as any)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="expo">Expo</SelectItem>
                <SelectItem value="cashier">Cashier / POS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">PIN</label>
            <Input type="password" inputMode="numeric" placeholder="••••" value={pin} onChange={(e)=>setPin(e.target.value)} maxLength={6} />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button className="w-full" onClick={login} disabled={loading || !pin}>{loading ? 'Signing in…' : 'Sign In'}</Button>
          <div className="text-xs text-muted-foreground text-center">Use your assigned PIN to access Kitchen, Expo, or POS.</div>
        </CardContent>
      </Card>
    </div>
  )
}

