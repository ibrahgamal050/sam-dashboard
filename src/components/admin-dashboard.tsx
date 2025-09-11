'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

interface Branch {
  id: number
  name: string
  address: string
  phone: string
  hours: string
}

// افتراض أن هذه الدالة موجودة في ملف منفصل للتعامل مع طلبات API
async function fetchApi(endpoint: string, method: string = 'GET', data?: any) {
  const response = await fetch(`/api/branches${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!response.ok) {
    throw new Error('حدث خطأ في الاتصال بالخادم')
  }
  return response.json()
}

export function AdminDashboardComponent() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    setIsLoading(true)
    try {
      const data = await fetchApi('')
      setBranches(data)
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات الفروع",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (editingBranch) {
      setEditingBranch({ ...editingBranch, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingBranch) {
      setIsLoading(true)
      try {
        if (editingBranch.id) {
          // تحديث فرع موجود
          await fetchApi(`/${editingBranch.id}`, 'PUT', editingBranch)
          toast({
            title: "تم التحديث",
            description: "تم تحديث بيانات الفرع بنجاح",
          })
        } else {
          // إضافة فرع جديد
          await fetchApi('', 'POST', editingBranch)
          toast({
            title: "تمت الإضافة",
            description: "تم إضافة الفرع الجديد بنجاح",
          })
        }
        await fetchBranches()
        setEditingBranch(null)
        setIsDialogOpen(false)
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في حفظ بيانات الفرع",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    setIsLoading(true)
    try {
      await fetchApi(`/${id}`, 'DELETE')
      await fetchBranches()
      toast({
        title: "تم الحذف",
        description: "تم حذف الفرع بنجاح",
      })
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الفرع",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingBranch({
      id: 0,
      name: '',
      address: '',
      phone: '',
      hours: '',
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background p-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم - إدارة الفروع</h1>
      
      <div className="mb-4">
        <Button onClick={handleAddNew} disabled={isLoading}>
          <Plus className="ml-2 h-4 w-4" /> إضافة فرع جديد
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>اسم الفرع</TableHead>
            <TableHead>العنوان</TableHead>
            <TableHead>رقم الهاتف</TableHead>
            <TableHead>ساعات العمل</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => (
            <TableRow key={branch.id}>
              <TableCell>{branch.name}</TableCell>
              <TableCell>{branch.address}</TableCell>
              <TableCell>{branch.phone}</TableCell>
              <TableCell>{branch.hours}</TableCell>
              <TableCell>
                <Button variant="outline" size="icon" className="ml-2" onClick={() => handleEdit(branch)} disabled={isLoading}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">تعديل</span>
                </Button>
                <Button variant="outline" size="icon" className="ml-2" onClick={() => handleDelete(branch.id)} disabled={isLoading}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">حذف</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBranch?.id ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">اسم الفرع</Label>
              <Input
                id="name"
                name="name"
                value={editingBranch?.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                name="address"
                value={editingBranch?.address || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                name="phone"
                value={editingBranch?.phone || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="hours">ساعات العمل</Label>
              <Input
                id="hours"
                name="hours"
                value={editingBranch?.hours || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isLoading}>إلغاء</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>{editingBranch?.id ? 'تحديث' : 'إضافة'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}