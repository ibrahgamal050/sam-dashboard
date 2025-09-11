'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Pencil, Trash2, Copy } from 'lucide-react'
import Link from 'next/link'

interface Page {
  _id: string;
  name: string;
  slug: string;
  language: string;
  isPublished: boolean;
  metadata: {
    created_at: string;
    updated_at: string;
    published_at?: string;
  };
}

interface PagesData {
  success: boolean;
  data: {
    pages: Page[];
  };
}

export default function PagesList() {
  const router = useRouter()
  const [pagesData, setPagesData] = useState<PagesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPages, setSelectedPages] = useState<string[]>([])

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    setIsLoading(true)
    try {
      const subdomain = window.location.hostname.split('.')[0]
      const response = await fetch(`/api/anaseldemeshky/pages`)
      if (!response.ok) {
        throw new Error('Failed to fetch pages')
      }
      const data: PagesData = await response.json()
      setPagesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPages(pagesData?.data.pages.map(page => page._id) || [])
    } else {
      setSelectedPages([])
    }
  }

  const handleCheck = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPages([...selectedPages, id])
    } else {
      setSelectedPages(selectedPages.filter(pageId => pageId !== id))
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        const subdomain = window.location.hostname.split('.')[0]
        const response = await fetch(`/api/${subdomain}/pages/${id}`, { method: 'DELETE' })
        if (!response.ok) {
          throw new Error('Failed to delete page')
        }
        fetchPages()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      }
    }
  }

  const handleDeleteMultiple = async () => {
    if (window.confirm('Are you sure you want to delete the selected pages?')) {
      try {
        const subdomain = window.location.hostname.split('.')[0]
        const response = await fetch(`/api/${subdomain}/pages/delete-multiple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedPages }),
        })
        if (!response.ok) {
          throw new Error('Failed to delete pages')
        }
        fetchPages()
        setSelectedPages([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      }
    }
  }

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy: ', err)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Pages</CardTitle>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={handleDeleteMultiple}
              disabled={selectedPages.length === 0}
            >
              Delete Selected
            </Button>
            <Button asChild>
              <Link href="/dashboard/page-editor">
                ADD Page <span className="ml-2">+</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedPages.length === pagesData?.data.pages.length}
                    onCheckedChange={handleCheckAll}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Copy URL</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagesData?.data.pages.map((page) => (
                <TableRow key={page._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPages.includes(page._id)}
                      onCheckedChange={(checked) => handleCheck(page._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>{page.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      page.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell>{page.language}</TableCell>
                  <TableCell>{new Date(page.metadata.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(page.metadata.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(page.slug)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/pages/${page._id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(page._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

