"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface Image {
  name: string
  image: string
}

interface Component {
  component_id: string
  type: string
  props: {
    images: Image[]
  }
  position: number
  _id: string
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
  seo: any[]
  __v: number
}

export function Page() {
  const { pageId } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/pages/${pageId}`)
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

    if (pageId) {
      fetchPage()
    }
  }, [pageId])

  const handleInputChange = (field: keyof Page, value: any) => {
    if (page) {
      setPage(prevPage => ({ ...prevPage!, [field]: value }))
    }
  }

  const handleComponentChange = (componentId: string, field: string, value: any) => {
    if (page) {
      setPage(prevPage => ({
        ...prevPage!,
        components: prevPage!.components.map(component =>
          component._id === componentId
            ? { ...component, props: { ...component.props, [field]: value } }
            : component
        )
      }))
    }
  }

  const handleImageChange = (componentId: string, index: number, field: keyof Image, value: string) => {
    if (page) {
      setPage(prevPage => ({
        ...prevPage!,
        components: prevPage!.components.map(component =>
          component._id === componentId
            ? {
                ...component,
                props: {
                  ...component.props,
                  images: component.props.images.map((image, i) =>
                    i === index ? { ...image, [field]: value } : image
                  )
                }
              }
            : component
        )
      }))
    }
  }

  const handleSave = async () => {
    if (!page) return

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(page),
      })

      if (!response.ok) {
        throw new Error('Failed to save page')
      }

      // Optionally, you can show a success message here
    } catch (err) {
      setError('Failed to save changes. Please try again.')
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

  return (
    <div className="container mx-auto p-4" dir={page.language === 'ar' ? 'rtl' : 'ltr'} lang={page.language}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تحرير الصفحة: {page.name}</CardTitle>
          <CardDescription>تعديل تفاصيل الصفحة ومكوناتها</CardDescription>
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

      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="components">
          <AccordionTrigger>المكونات</AccordionTrigger>
          <AccordionContent>
            {page.components.map((component) => (
              <Card key={component._id} className="mb-4">
                <CardHeader>
                  <CardTitle>{component.type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="images" className="w-full">
                    <TabsList>
                      <TabsTrigger value="images">الصور</TabsTrigger>
                    </TabsList>
                    <TabsContent value="images">
                      {component.props.images.map((image, index) => (
                        <div key={index} className="mb-4 p-4 border rounded">
                          <div className="mb-2">
                            <Label htmlFor={`image-name-${index}`}>اسم الصورة</Label>
                            <Input
                              id={`image-name-${index}`}
                              value={image.name}
                              onChange={(e) => handleImageChange(component._id, index, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`image-url-${index}`}>رابط الصورة</Label>
                            <Input
                              id={`image-url-${index}`}
                              value={image.image}
                              onChange={(e) => handleImageChange(component._id, index, 'image', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تحسين محركات البحث (SEO)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">لم يتم تعيين بيانات تحسين محركات البحث بعد.</p>
          <Button onClick={() => console.log("Add SEO data")}>إضافة بيانات SEO</Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
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

      <div className="flex justify-end">
        <Button onClick={handleSave}>حفظ التغييرات</Button>
      </div>
    </div>
  )
}