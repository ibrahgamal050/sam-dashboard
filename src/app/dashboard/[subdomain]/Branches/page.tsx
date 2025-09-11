'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Branch {
  id: number;
  name: string;
  nameEn: string;
  address: string;
  url: string;
  image: string;
  _id?: string;
}

export default function BranchManager() {
  const { subdomain } = useParams() as { subdomain: string }
  const [branches, setBranches] = useState<Branch[]>([])
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchApi = useCallback(async (endpoint: string, method: string = 'GET', data?: any) => {
    if (!subdomain) {
      throw new Error('Subdomain is not available');
    }
  
    const response = await fetch(`/api/${subdomain}/branches${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'An error occurred while communicating with the server');
    }

    return response.json();
  }, [subdomain]);

  const fetchBranches = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchApi('')
      setBranches(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch branch data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchApi, toast])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const handleSaveBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingBranch) return;
    setIsLoading(true);
  
    const endpoint = editingBranch.id ? `/${editingBranch.id}` : '';
    const method = editingBranch.id ? 'PUT' : 'POST';
    const branchData = { ...editingBranch };
    if (!editingBranch.id) delete branchData._id;
  
    try {
      await fetchApi(endpoint, method, branchData);
      toast({
        title: editingBranch.id ? "Updated" : "Added",
        description: editingBranch.id ? "Branch updated successfully" : "New branch added successfully",
      });
      await fetchBranches();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save branch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Invalid branch ID",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await fetchApi(`/${id}`, 'DELETE');
      toast({ title: "Deleted", description: "Branch deleted successfully" });
      await fetchBranches();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditingBranch(prev => (prev ? { ...prev, [name]: value } : prev))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto" dir="rtl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">لوحة التحكم - إدارة الفروع</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={() => setIsDialogOpen(true)} disabled={isLoading}>
            <Plus className="ml-2 h-4 w-4" /> إضافة فرع جديد
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الفرع</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="icon" onClick={() => {
                      setEditingBranch(branch);
                      setIsDialogOpen(true);
                    }} disabled={isLoading}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteBranch(branch.id.toString())} disabled={isLoading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBranch?.id ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveBranch} className="space-y-4">
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
                <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  value={editingBranch?.nameEn || ''}
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
                <Label htmlFor="url">الموقع</Label>
                <Input
                  type="url"
                  id="url"
                  name="url"
                  value={editingBranch?.url || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="image">الصورة</Label>
                <Input
                  id="image"
                  name="image"
                  value={editingBranch?.image || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  {editingBranch?.id ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}