"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import SEOEditor from '@/components/SEOEditor'
import ComponentEditor from '@/components/ComponentEditor'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Layout, Settings, FileText, Share2, Menu, Save, AlertCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toast, ToastDescription } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

export function PageEditorComponent() {
  const { pageId, subdomain } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('general')
  const [isMobile, setIsMobile] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const handleSEOSave = (updatedSEO: SEO) => {
    setPage(prevPage => ({ ...prevPage!, seo: updatedSEO }))
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

      setToastMessage('Changes saved successfully!')
      setShowToast(true)
    } catch (err) {
      setToastMessage('Failed to save changes. Please try again.')
      setShowToast(true)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
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
      <div className="container mx-auto p-4">
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
      <div className="container mx-auto p-4">
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

  const SidebarContent = () => (
    <nav className="space-y-2">
      <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('general')}>
        <Layout className="w-5 h-5 mr-2" />
        <span className="text-lg">عام</span>
      </Button>
      <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('components')}>
        <FileText className="w-5 h-5 mr-2" />
        <span className="text-lg">المكونات</span>
      </Button>
      <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('seo')}>
        <Share2 className="w-5 h-5 mr-2" />
        <span className="text-lg">تحسين محركات البحث</span>
      </Button>
      <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('metadata')}>
        <Settings className="w-5 h-5 mr-2" />
        <span className="text-lg">البيانات الوصفية</span>
      </Button>
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100" dir={page.language === 'ar' ? 'rtl' : 'ltr'} lang={page.language}>
      {!isMobile && (
        <aside className="w-64 border-r bg-white p-4">
          <h2 className="text-2xl font-bold mb-6">تحرير الصفحة</h2>
          <SidebarContent />
        </aside>
      )}

      <main className="flex-1 overflow-y-auto">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="m-4">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <h2 className="text-2xl font-bold mb-6">تحرير الصفحة</h2>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        )}
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{page.name}</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSave} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Save className="w-5 h-5 mr-2" />
                    حفظ التغييرات
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>حفظ جميع التغييرات</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Card className="mb-6 shadow-lg">
            <CardContent className="p-0">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 p-0 rounded-t-lg">
                  <TabsTrigger value="general" className="data-[state=active]:bg-background rounded-none flex-1">عام</TabsTrigger>
                  <TabsTrigger value="components" className="data-[state=active]:bg-background rounded-none flex-1">المكونات</TabsTrigger>
                  <TabsTrigger value="seo" className="data-[state=active]:bg-background rounded-none flex-1">تحسين محركات البحث</TabsTrigger>
                  <TabsTrigger value="metadata" className="data-[state=active]:bg-background rounded-none flex-1">البيانات الوصفية</TabsTrigger>
                </TabsList>
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <TabsContent value="general" className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name" className="text-lg font-medium">اسم الصفحة</Label>
                          <Input
                            id="name"
                            value={page.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="slug" className="text-lg font-medium">الرابط المختصر</Label>
                          <Input
                            id="slug"
                            value={page.slug}
                            onChange={(e) => handleInputChange('slug', e.target.value)}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="headerImage" className="text-lg font-medium">صورة الرأس</Label>
                        <Input
                          id="headerImage"
                          value={page.headerImage}
                          onChange={(e) => handleInputChange('headerImage', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isPublished"
                          checked={page.isPublished}
                          onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                        />
                        <Label htmlFor="isPublished" className="text-lg font-medium">منشور</Label>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="components" className="p-6">
                    <ComponentEditor components={page.components} onUpdate={handleComponentUpdate} />
                  </TabsContent>
                  <TabsContent value="seo" className="p-6">
                    <SEOEditor initialSEO={page.seo} onSave={handleSEOSave} />
                  </TabsContent>
                  <TabsContent value="metadata" className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-lg font-medium">تاريخ الإنشاء</Label>
                        <p className="mt-1">{new Date(page.metadata.created_at).toLocaleString(page.language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                      </div>
                      <div>
                        <Label className="text-lg font-medium">تاريخ التحديث</Label>
                        <p className="mt-1">{new Date(page.metadata.updated_at).toLocaleString(page.language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      {showToast && (
        <Toast
          title={toastMessage.includes('successfully') ? 'Success' : 'Error'}
          onOpenChange={setShowToast}
        >
          <div className="flex items-center gap-2">
            {toastMessage.includes('successfully') ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <ToastDescription>{toastMessage}</ToastDescription>
          </div>
        </Toast>
      )}
    </div>
  )
}
