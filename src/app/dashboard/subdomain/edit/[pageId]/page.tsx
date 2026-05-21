"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import SEOEditor from '@/components/SEOEditor'
import ComponentEditor from '@/components/ComponentEditor'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Layout, Settings, FileText, Share2, Save } from 'lucide-react'
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"


interface Image {
  name: string
  image: string
}

interface Component {
  component_id: string
  type: string
  props: {
    images?: Image[]
    [key: string]: any
  }
  position: number
  _id: string
}

interface SEO {
  title: string
  description: string
  keywords: string[]
  og_title: string
  og_description: string
  og_image: string
  twitter_title: string
  twitter_description: string
  twitter_image: string
  canonical_url: string
}

interface Page {
  metadata: {
    created_at: string
    updated_at: string
  }
  _id: string
  name: string
  slug: string
  language: string
  restaurantId: string
  template: boolean
  isPublished: boolean
  headerImage: string
  components: Component[]
  seo: SEO
  __v: number
}

export default function PageEditor() {
    const _p = useParams() as { pageId?: string; subdomain?: string; slug?: string }
    const pageId = _p.pageId ?? ""
    const subdomain = _p.subdomain ?? _p.slug ?? ""
    const [page, setPage] = useState<Page | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('general')
    const { toast } = useToast()
  

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/pages/${subdomain}/${pageId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch page')
        }
        const data = await response.json()
        setPage(data)
      } catch (err) {
        setError('Failed to load page. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (pageId && subdomain) {
      fetchPage()
    }
  }, [pageId, subdomain])

  const handleInputChange = (field: keyof Page, value: any) => {
    if (page) {
      setPage(prevPage => ({ ...prevPage!, [field]: value }))
    }
  }

  const handleComponentUpdate = (updatedComponents: Component[]) => {
    setPage(prevPage => ({ ...prevPage!, components: updatedComponents }))
  }

 
  const handleSEOSave = async (updatedSEO: SEO) => {
    if (!page) return

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seo: updatedSEO }),
      })

      if (!response.ok) {
        throw new Error('Failed to update SEO')
      }

      setPage(prevPage => ({
        ...prevPage!,
        seo: updatedSEO
      }))

      toast({
        title: "Success",
        description: "SEO data updated successfully.",
      })
    } catch (error) {
      console.error('Error updating SEO:', error)
      toast({
        title: "Error",
        description: "Failed to update SEO. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!page) return

    try {
      const response = await fetch(`/api/pages/${subdomain}/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(page),
      })

      if (!response.ok) {
        throw new Error('Failed to save page')
      }

      toast({
        title: "Changes saved",
        description: "Your changes have been successfully saved.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="container mx-auto p-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Page Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested page could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100" dir={page.language === 'ar' ? 'rtl' : 'ltr'} lang={page.language}>
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">تحرير الصفحة</h2>
          <nav className="space-y-2">
            {[
              { id: 'general', icon: Layout, label: 'عام' },
              { id: 'components', icon: FileText, label: 'المكونات' },
              { id: 'seo', icon: Share2, label: 'تحسين محركات البحث' },
              { id: 'metadata', icon: Settings, label: 'البيانات الوصفية' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold">{page.name}</h1>
            <Button onClick={handleSave} size="lg">
              <Save className="w-4 h-4 mr-2" />
              حفظ التغييرات
            </Button>
          </header>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            {activeTab === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل الصفحة</CardTitle>
                  <CardDescription>تعديل المعلومات الأساسية للصفحة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">اسم الصفحة</Label>
                        <Input
                          id="name"
                          value={page.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="slug">الرابط المختصر</Label>
                        <Input
                          id="slug"
                          value={page.slug}
                          onChange={(e) => handleInputChange('slug', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="headerImage">صورة الرأس</Label>
                      <Input
                        id="headerImage"
                        value={page.headerImage}
                        onChange={(e) => handleInputChange('headerImage', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPublished"
                        checked={page.isPublished}
                        onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                      />
                      <Label htmlFor="isPublished">منشور</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'components' && (
              <Card>
                <CardHeader>
                  <CardTitle>المكونات</CardTitle>
                  <CardDescription>تعديل مكونات الصفحة</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComponentEditor components={page.components} onUpdate={handleComponentUpdate} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'seo' && (
              <SEOEditor initialSEO={page.seo} onSave={handleSEOSave} />
            )}

            {activeTab === 'metadata' && (
              <Card>
                <CardHeader>
                  <CardTitle>البيانات الوصفية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>تاريخ الإنشاء:</strong> {new Date(page.metadata.created_at).toLocaleString(page.language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    <p><strong>تاريخ التحديث:</strong> {new Date(page.metadata.updated_at).toLocaleString(page.language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        </div>
      </main>
      <Toaster />
    </div>
  )
}