"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUpload } from "./image-upload"
import { ImageGallery } from "./image-gallery"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { IMenuImage } from "@/types/menu"

interface MenuImageManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: IMenuImage[]
  onImagesChange: (images: IMenuImage[]) => void
  onSelectImage?: (image: IMenuImage) => void
  subdomain: string;
  
}

export function MenuImageManager({
  open,
  onOpenChange,
  images,
  onImagesChange,
  subdomain,
  onSelectImage,
 
}: MenuImageManagerProps) {
  const [activeTab, setActiveTab] = useState<string>("gallery")
  
  const handleImageUpload = async (imageUrl: string, altText: string) => {
    console.log()
    try {
      const newImage: IMenuImage = {
        _id: crypto.randomUUID(),
        url: imageUrl,
        altText,
        createdAt: new Date(),
      }

      onImagesChange([...images, newImage])
      setActiveTab("gallery")
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      // Find the image to get its URL
      const imageToDelete = images.find((img) => img._id?.toString() === imageId)

      if (imageToDelete?.url) {
        // In a real application, you would also delete from your server
        // await deleteImage(imageToDelete.url)
      }

      const updatedImages = images.filter((img) => img._id?.toString() !== imageId)
      onImagesChange(updatedImages)
    } catch (error) {
      console.error("Error deleting image:", error)
      throw error
    }
  }

  const handleUpdateImage = async (imageId: string, altText: string) => {
    try {
      const updatedImages = images.map((img) => (img._id?.toString() === imageId ? { ...img, altText } : img))
      onImagesChange(updatedImages)
    } catch (error) {
      console.error("Error updating image:", error)
      throw error
    }
  }

  const handleSelectImage = (image: IMenuImage) => {
    if (onSelectImage) {
      onSelectImage(image)
      onOpenChange(false)
    }
  }

  // Define available subdomains - in a real app, this might come from your restaurant data
 
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Menu Image Manager</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="gallery" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Image Gallery</TabsTrigger>
            <TabsTrigger value="upload">Upload New Image</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="py-4">
            <ImageGallery
              images={images}
              onSelectImage={handleSelectImage}
              onDeleteImage={handleDeleteImage}
              onUpdateImage={handleUpdateImage}
            />
          </TabsContent>

          <TabsContent value="upload" className="py-4">
            <ImageUpload onImageUpload={handleImageUpload} subdomain={subdomain} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
