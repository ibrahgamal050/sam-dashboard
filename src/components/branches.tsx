'use client'
import { useParams } from 'next/navigation'

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

interface Branch {
  nameEn: string
  nameAr: string
  address: string
  image: string
  mapurl: string
  slug: string
}

interface BranchesData {
  _id: string
  restaurantId: string
  name: string
  branches: Branch[]
}

async function fetchApi(endpoint: string, method: string = 'GET', data?: any) {
  const { subdomain } = useParams() as { subdomain: string }
  const response = await fetch(`/api/${subdomain}/branches${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!response.ok) {
    throw new Error('An error occurred while communicating with the server')
  }
  return response.json()
}

export default function Branches() {
  
  const [branchesData, setBranchesData] = useState<BranchesData | null>(null)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchBranchesData()
  }, [])

  const fetchBranchesData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchApi('')
      setBranchesData(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch branch data",
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
    if (editingBranch && branchesData) {
      setIsLoading(true)
      try {
        let updatedBranches: Branch[]
        if (editingBranch.slug) {
          // Editing existing branch
          updatedBranches = branchesData.branches.map(b => 
            b.slug === editingBranch.slug ? editingBranch : b
          )
        } else {
          // Adding new branch
          const newBranch = {
            ...editingBranch,
            slug: generateSlug(editingBranch.nameEn)
          }
          updatedBranches = [...branchesData.branches, newBranch]
        }
        
        const updatedData = { ...branchesData, branches: updatedBranches }
        await fetchApi('', 'PUT', updatedData)
        
        toast({
          title: editingBranch.slug ? "Updated" : "Added",
          description: `Branch ${editingBranch.slug ? 'updated' : 'added'} successfully`,
        })
        
        setBranchesData(updatedData)
        setEditingBranch(null)
        setIsDialogOpen(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save branch data",
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

  const handleDelete = async (slug: string) => {
    if (branchesData) {
      setIsLoading(true)
      try {
        const updatedBranches = branchesData.branches.filter(b => b.slug !== slug)
        const updatedData = { ...branchesData, branches: updatedBranches }
        await fetchApi('', 'PUT', updatedData)
        
        toast({
          title: "Deleted",
          description: "Branch deleted successfully",
        })
        
        setBranchesData(updatedData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete branch",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleAddNew = () => {
    setEditingBranch({
      nameEn: '',
      nameAr: '',
      address: '',
      image: '',
      mapurl: '',
      slug: '',
    })
    setIsDialogOpen(true)
  }

  const generateSlug = (nameEn: string): string => {
    return nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{branchesData?.name || 'Restaurant Branches'}</CardTitle>
          <CardDescription>Manage your restaurant branches</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name (EN)</TableHead>
                <TableHead>Branch Name (AR)</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchesData?.branches.map((branch) => (
                <TableRow key={branch.slug}>
                  <TableCell>{branch.nameEn}</TableCell>
                  <TableCell>{branch.nameAr}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(branch)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(branch.slug)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button className="mt-4" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Branch
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch?.slug ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nameEn" className="text-right">
                  Name (EN)
                </Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  value={editingBranch?.nameEn || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nameAr" className="text-right">
                  Name (AR)
                </Label>
                <Input
                  id="namAr"
                  name="nameAr"
                  value={editingBranch?.nameAr || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={editingBranch?.address || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="image"
                  name="image"
                  value={editingBranch?.image || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mapurl" className="text-right">
                  Map URL
                </Label>
                <Input
                  id="mapurl"
                  name="mapurl"
                  value={editingBranch?.mapurl || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}