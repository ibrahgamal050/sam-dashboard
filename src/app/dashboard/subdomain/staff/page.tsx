"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type Staff = { _id: string; name: string; role: string; active: boolean }

export default function StaffPage() {
  const params = useParams() as { subdomain?: string; slug?: string }
  const subdomain = params.subdomain ?? params.slug ?? ""
  const [list, setList] = useState<Staff[]>([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('cashier')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const res = await fetch(`/api/${subdomain}/employees`)
    if (res.ok) { const data = await res.json(); setList(data.staff || []) }
  }
  useEffect(() => { load() }, [subdomain])

  async function add() {
    setLoading(true)
    try {
      const res = await fetch(`/api/${subdomain}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, role, pin }) })
      if (res.ok) { setName(''); setPin(''); setRole('cashier'); await load() }
    } finally { setLoading(false) }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/${subdomain}/employees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) })
    await load()
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Управление персоналом</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input placeholder="Имя" value={name} onChange={(e)=>setName(e.target.value)} />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Должность" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Менеджер</SelectItem>
                <SelectItem value="cashier">Кассир</SelectItem>
                <SelectItem value="waiter">Официант</SelectItem>
                <SelectItem value="expo">Экспо</SelectItem>
                <SelectItem value="kitchen">Кухня</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="ПИН-код (4-6 цифр)" value={pin} onChange={(e)=>setPin(e.target.value)} />
            <Button onClick={add} disabled={!name || !role || !pin || loading}>Добавить</Button>
          </div>

          <div className="border-t pt-3">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="p-2">Имя</th>
                  <th className="p-2">Должность</th>
                  <th className="p-2">Статус</th>
                  <th className="p-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s)=> (
                  <tr key={s._id} className="border-t">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 capitalize">{s.role}</td>
                    <td className="p-2">{s.active ? 'Активен' : 'Неактивен'}</td>
                    <td className="p-2">
                      <Button variant="secondary" size="sm" onClick={()=>toggleActive(s._id, !s.active)}>{s.active ? 'Деактивировать' : 'Активировать'}</Button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (<tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Сотрудников пока нет</td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

