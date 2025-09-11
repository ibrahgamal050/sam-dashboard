'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface Component {
  _id: string
  component_id: string
  type: string
  props: Record<string, any>
  position: number
}

interface Page {
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
  metadata: {
    created_at: string
    updated_at: string
  }
}

interface PageEditorProps {
  pages: Page[]
  onSave: (pages: Page[]) => void
}

export default function PageEditor({ pages: initialPages = [], onSave }: PageEditorProps) {
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [selectedPage, setSelectedPage] = useState<string | null>(null)

  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]._id)
    }
  }, [pages, selectedPage])

  const handlePageChange = (pageId: string) => {
    setSelectedPage(pageId)
  }

  const handleInputChange = (pageId: string, field: string, value: any) => {
    setPages(prevPages =>
      prevPages.map(page =>
        page._id === pageId ? { ...page, [field]: value } : page
      )
    )
  }

  const handleComponentChange = (pageId: string, componentId: string, field: string, value: any) => {
    setPages(prevPages =>
      prevPages.map(page =>
        page._id === pageId
          ? {
              ...page,
              components: page.components.map(component =>
                component._id === componentId
                  ? { ...component, props: { ...component.props, [field]: value } }
                  : component
              ),
            }
          : page
      )
    )
  }

  const handleSave = () => {
    onSave(pages)
  }

  const currentPage = pages.find(page => page._id === selectedPage)

  if (pages.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Pages Available</CardTitle>
            <CardDescription>There are no pages to edit at the moment.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs value={selectedPage || undefined} onValueChange={handlePageChange}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          {pages.map(page => (
            <TabsTrigger key={page._id} value={page._id}>
              {page.name} ({page.language})
            </TabsTrigger>
          ))}
        </TabsList>
        {currentPage && (
          <TabsContent value={currentPage._id}>
            <Card>
              <CardHeader>
                <CardTitle>{currentPage.name}</CardTitle>
                <CardDescription>Edit page details and components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={currentPage.name}
                        onChange={(e) => handleInputChange(currentPage._id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={currentPage.slug}
                        onChange={(e) => handleInputChange(currentPage._id, 'slug', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="headerImage">Header Image</Label>
                    <Input
                      id="headerImage"
                      value={currentPage.headerImage}
                      onChange={(e) => handleInputChange(currentPage._id, 'headerImage', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublished"
                      checked={currentPage.isPublished}
                      onCheckedChange={(checked) => handleInputChange(currentPage._id, 'isPublished', checked)}
                    />
                    <Label htmlFor="isPublished">Published</Label>
                  </div>
                </div>
                <div className="mt-6">
                  <CardTitle className="mb-4">Components</CardTitle>
                  {currentPage.components.map(component => (
                    <Card key={component._id} className="mb-4">
                      <CardHeader>
                        <CardTitle>{component.type}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Object.entries(component.props).map(([key, value]) => (
                          <div key={key} className="mb-4">
                            <Label htmlFor={`${component._id}-${key}`}>{key}</Label>
                            {typeof value === 'string' ? (
                              <Input
                                id={`${component._id}-${key}`}
                                value={value}
                                onChange={(e) => handleComponentChange(currentPage._id, component._id, key, e.target.value)}
                              />
                            ) : (
                              <Textarea
                                id={`${component._id}-${key}`}
                                value={JSON.stringify(value, null, 2)}
                                onChange={(e) => {
                                  try {
                                    const parsedValue = JSON.parse(e.target.value)
                                    handleComponentChange(currentPage._id, component._id, key, parsedValue)
                                  } catch (error) {
                                    console.error('Invalid JSON:', error)
                                  }
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}