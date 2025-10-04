"use client"

import { useState } from "react"
import { Trash2, Pencil, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { IMenuImage } from "@/types/menu"

// Add this function inside the component file, before the ImageGallery component
function formatDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

interface ImageGalleryProps {
  images: IMenuImage[]
  onSelectImage: (image: IMenuImage) => void
  onDeleteImage: (imageId: string) => Promise<void>
  onUpdateImage: (imageId: string, altText: string) => Promise<void>
}

export function ImageGallery({ images, onSelectImage, onDeleteImage, onUpdateImage }: ImageGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingImage, setEditingImage] = useState<IMenuImage | null>(null)
  const [newAltText, setNewAltText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredImages = images.filter((image) => image.altText.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleEditClick = (image: IMenuImage) => {
    setEditingImage(image)
    setNewAltText(image.altText)
  }

  const handleUpdateImage = async () => {
    if (!editingImage) return

    setIsUpdating(true)
    try {
      await onUpdateImage(editingImage._id?.toString() || "", newAltText)
      setEditingImage(null)
    } catch (error) {
      console.error("Error updating image:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    setIsDeleting(true)
    try {
      await onDeleteImage(imageId)
    } catch (error) {
      console.error("Error deleting image:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search images..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {filteredImages.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No images match your search" : "No images uploaded yet"}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <div key={image._id?.toString()} className="group relative">
              <div
                className="aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onSelectImage(image)}
              >
                <img src={image.url || "/placeholder.svg"} alt={image.altText} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">{image.altText}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-white/80 hover:bg-white"
                  onClick={() => handleEditClick(image)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDeleteImage(image._id?.toString() || "")}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                {image.createdAt && formatDateString(new Date(image.createdAt))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Image Dialog */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
          </DialogHeader>

          {editingImage && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden border">
                <img
                  src={editingImage.url || "/placeholder.svg"}
                  alt={editingImage.altText}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-alt-text">Alt Text</Label>
                <Input
                  id="edit-alt-text"
                  value={newAltText}
                  onChange={(e) => setNewAltText(e.target.value)}
                  placeholder="Describe this image"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingImage(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateImage}
                  disabled={isUpdating || !newAltText.trim() || newAltText === editingImage.altText}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
