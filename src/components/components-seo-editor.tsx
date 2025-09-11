'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

interface SEOEditorProps {
  initialSEO: Partial<SEO>
  onSave: (seo: SEO) => void
}

export function SeoEditor({ initialSEO, onSave }: SEOEditorProps) {
  const [seo, setSEO] = useState<SEO>({
    title: '',
    description: '',
    keywords: [],
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    canonical_url: '',
    ...initialSEO
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SEO, string>>>({})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    setSEO(prevSEO => ({ ...prevSEO, ...initialSEO }))
  }, [initialSEO])

  const handleInputChange = (field: keyof SEO, value: string) => {
    setSEO(prevSEO => ({ ...prevSEO, [field]: value }))
    setErrors(prevErrors => ({ ...prevErrors, [field]: '' }))
  }

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(keyword => keyword.trim()).filter(Boolean)
    setSEO(prevSEO => ({ ...prevSEO, keywords }))
    setErrors(prevErrors => ({ ...prevErrors, keywords: '' }))
  }

  const validateSEO = (): boolean => {
    const newErrors: Partial<Record<keyof SEO, string>> = {}

    if (seo.title.length > 60) newErrors.title = 'العنوان يجب أن يكون 60 حرفًا أو أقل'
    if (seo.description.length > 160) newErrors.description = 'الوصف يجب أن يكون 160 حرفًا أو أقل'
    if (seo.keywords.length === 0) newErrors.keywords = 'يجب إدخال كلمة مفتاحية واحدة على الأقل'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateSEO()) {
      onSave(seo)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } else {
      setSaveStatus('error')
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>تحسين محركات البحث (SEO)</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="general">
            <AccordionTrigger>البيانات الأساسية</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seo-title">عنوان الصفحة</Label>
                  <Input
                    id="seo-title"
                    value={seo.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="عنوان الصفحة (60 حرف كحد أقصى)"
                    maxLength={60}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {seo.title.length}/60 حرف
                  </p>
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
                </div>
                <div>
                  <Label htmlFor="seo-description">وصف الصفحة</Label>
                  <Textarea
                    id="seo-description"
                    value={seo.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="وصف الصفحة (160 حرف كحد أقصى)"
                    maxLength={160}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {seo.description.length}/160 حرف
                  </p>
                  {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                </div>
                <div>
                  <Label htmlFor="seo-keywords">الكلمات المفتاحية</Label>
                  <Input
                    id="seo-keywords"
                    value={seo.keywords.join(', ')}
                    onChange={(e) => handleKeywordsChange(e.target.value)}
                    placeholder="الكلمات المفتاحية (مفصولة بفواصل)"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {seo.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                  {errors.keywords && <p className="text-sm text-destructive mt-1">{errors.keywords}</p>}
                </div>
                <div>
                  <Label htmlFor="seo-canonical">الرابط القانوني</Label>
                  <Input
                    id="seo-canonical"
                    value={seo.canonical_url}
                    onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                    placeholder="الرابط القانوني للصفحة"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="og">
            <AccordionTrigger>بيانات Open Graph</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="og-title">عنوان Open Graph</Label>
                  <Input
                    id="og-title"
                    value={seo.og_title}
                    onChange={(e) => handleInputChange('og_title', e.target.value)}
                    placeholder="عنوان Open Graph"
                  />
                </div>
                <div>
                  <Label htmlFor="og-description">وصف Open Graph</Label>
                  <Textarea
                    id="og-description"
                    value={seo.og_description}
                    onChange={(e) => handleInputChange('og_description', e.target.value)}
                    placeholder="وصف Open Graph"
                  />
                </div>
                <div>
                  <Label htmlFor="og-image">صورة Open Graph</Label>
                  <Input
                    id="og-image"
                    value={seo.og_image}
                    onChange={(e) => handleInputChange('og_image', e.target.value)}
                    placeholder="رابط صورة Open Graph"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="twitter">
            <AccordionTrigger>بيانات Twitter</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="twitter-title">عنوان Twitter</Label>
                  <Input
                    id="twitter-title"
                    value={seo.twitter_title}
                    onChange={(e) => handleInputChange('twitter_title', e.target.value)}
                    placeholder="عنوان Twitter"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter-description">وصف Twitter</Label>
                  <Textarea
                    id="twitter-description"
                    value={seo.twitter_description}
                    onChange={(e) => handleInputChange('twitter_description', e.target.value)}
                    placeholder="وصف Twitter"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter-image">صورة Twitter</Label>
                  <Input
                    id="twitter-image"
                    value={seo.twitter_image}
                    onChange={(e) => handleInputChange('twitter_image', e.target.value)}
                    placeholder="رابط صورة Twitter"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mt-6">
          <Button onClick={handleSave} className="w-full">حفظ بيانات SEO</Button>
          {saveStatus === 'success' && (
            <Alert variant="default" className="mt-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>تم الحفظ بنجاح</AlertTitle>
              <AlertDescription>
                تم حفظ بيانات SEO بنجاح.
              </AlertDescription>
            </Alert>
          )}
          {saveStatus === 'error' && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ في الحفظ</AlertTitle>
              <AlertDescription>
                يرجى التحقق من الأخطاء وإعادة المحاولة.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}