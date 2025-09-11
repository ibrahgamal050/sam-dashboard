'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'

interface PageData {
  _id?: string
  name: string
  slug: string
  language: 'en' | 'ar'
  isPublished: boolean
  headerImage: string
  seoTitle: string
  seoDescription: string
  components: any[] // We'll keep this simple for now
}

export default function PageEditor({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [pageData, setPageData] = useState<PageData>({
    name: '',
    slug: '',
    language: 'en',
    isPublished: false,
    headerImage: '',
    seoTitle: '',
    seoDescription: '',
    components: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchPageData(params.id)
    }
  }, [params.id])

  const fetchPageData = async (id: string) => {
    setIsLoading(true)
    try {
      const subdomain = window.location.hostname.split('.')[0]
      const response = await fetch(`/api/${subdomain}/pages/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch page data')
      }
      const data = await response.json()
      setPageData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPageData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setPageData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const subdomain = window.location.hostname.split('.')[0]
      const url = params.id && params.id !== 'new' 
        ? `/api/${subdomain}/pages/${params.id}`
        : `/api/${subdomain}/pages`
      const method = params.id && params.id !== 'new' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      })

      if (!response.ok) {
        throw new Error('Failed to save page')
      }

      router.push('/dashboard/pages') // Redirect to pages list after successful save
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
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
      <h1 className="text-2xl font-bold mb-4">
        {params.id && params.id !== 'new' ? 'Edit Page' : 'Create New Page'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Page Name</label>
              <Input
                id="name"
                name="name"
                value={pageData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
              <Input
                id="slug"
                name="slug"
                value={pageData.slug}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">Language</label>
              <Select
                name="language"
                value={pageData.language}
                onValueChange={(value) => handleSelectChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="isPublished" className="block text-sm font-medium text-gray-700">Published</label>
              <Select
                name="isPublished"
                value={pageData.isPublished ? 'true' : 'false'}
                onValueChange={(value) => handleSelectChange('isPublished', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Published</SelectItem>
                  <SelectItem value="false">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700">SEO Title</label>
              <Input
                id="seoTitle"
                name="seoTitle"
                value={pageData.seoTitle}
                onChange={handleInputChange}
                maxLength={60}
              />
            </div>
            <div>
              <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">SEO Description</label>
              <Textarea
                id="seoDescription"
                name="seoDescription"
                value={pageData.seoDescription}
                onChange={handleInputChange}
                maxLength={160}
              />
            </div>
            <div>
              <label htmlFor="headerImage" className="block text-sm font-medium text-gray-700">Header Image URL</label>
              <Input
                id="headerImage"
                name="headerImage"
                value={pageData.headerImage}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* We'll add component management here in a future iteration */}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Page'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

