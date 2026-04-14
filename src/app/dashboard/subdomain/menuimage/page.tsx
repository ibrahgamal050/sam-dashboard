'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Save, ImageIcon } from 'lucide-react'

export default function Component() {
  const [image, setImage] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [menuTitle, setMenuTitle] = useState('')
  const [menuItems, setMenuItems] = useState<{ item: string, price: string }[]>([]);  // تعريف حالة menuItems

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Clear previous extracted text and reset image state
      setExtractedText('')
      setMenuItems([])  // Reset the menu items
      setImage(file)
      setIsProcessing(true)
  
      // Create FormData to send image
      const formData = new FormData()
      formData.append('image', file)
  
      try {
        // Send image to backend OCR API
        const response = await fetch('http://127.0.0.1:5000/ocr', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.statusText}`);
        }
  
        const data = await response.json()
        setExtractedText(data.text)  // Set the extracted text
        setMenuItems(data.menu_items)  // Set the extracted menu items
  
      } catch (error) {
        console.error('Error processing image:', error instanceof Error ? error.message : String(error));
        alert('حدث خطأ أثناء معالجة الصورة');
      } finally {
        setIsProcessing(false)
      }
    }
  }
  

  const handleSave = async () => {
    if (!menuTitle || !extractedText) {
      alert('يرجى تعبئة جميع الحقول.');
      return;
    }

    try {
      // Send data to save menu
      await fetch('/api/save-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: menuTitle,
          content: extractedText,
        }),
      })
      
      alert('تم حفظ القائمة بنجاح!')
    } catch (error) {
      console.error('Error saving menu:', error)
      alert('حدث خطأ أثناء حفظ القائمة')
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>نظام OCR للقائمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان القائمة</Label>
            <Input
              id="title"
              placeholder="أدخل عنوان القائمة"
              value={menuTitle}
              onChange={(e) => setMenuTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">رفع صورة القائمة</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {image && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  {image.name}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">النص المستخرج</Label>
            <Textarea
              id="text"
              placeholder={isProcessing ? "جاري معالجة الصورة..." : "سيظهر النص المستخرج هنا"}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={10}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>عناصر القائمة المستخرجة</Label>
            <ul>
              {menuItems.length > 0 ? (
                menuItems.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.item}</span>
                    <span>{item.price}</span>
                  </li>
                ))
              ) : (
                <p>لا توجد عناصر قائمة بعد.</p>
              )}
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSave}
            disabled={!extractedText || !menuTitle}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            حفظ القائمة
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
