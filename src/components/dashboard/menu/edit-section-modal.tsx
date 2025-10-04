"use client"

import { useState } from "react"
import { ImagePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { ICategory } from "@/types/menu"

interface EditSectionModalProps {
  section: ICategory
  onSave: (section: ICategory) => void
  onCancel: () => void
  onDelete: () => void
}

export function EditSectionModal({ section, onSave, onCancel, onDelete }: EditSectionModalProps) {
  const [editedSection, setEditedSection] = useState<ICategory>({ ...section })
  const [activeLanguage, setActiveLanguage] = useState<"en" | "ar">("en")

  const handleNameChange = (lang: "en" | "ar", value: string) => {
    setEditedSection({
      ...editedSection,
      name: {
        ...editedSection.name,
        [lang]: value,
      },
    })
  }

  const handleDescriptionChange = (lang: "en" | "ar", value: string) => {
    setEditedSection({
      ...editedSection,
      description: {
        ...(editedSection.description || { en: "", ar: "" }),
        [lang]: value,
      },
    })
  }

  const handleImageChange = (value: string) => {
    setEditedSection({
      ...editedSection,
      image: value,
    })
  }

  const handleVisibilityChange = (checked: boolean) => {
    setEditedSection({
      ...editedSection,
      visible: checked,
    })
  }

  const handleSave = () => {
    onSave(editedSection)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit section details</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" onClick={() => setActiveLanguage(activeLanguage === "en" ? "ar" : "en")}>
            {activeLanguage === "en" ? "العربية" : "English"}
          </Button>
        </div>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-name" className="text-base">
              Section name ({activeLanguage}) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="section-name"
              value={editedSection.name[activeLanguage] || ""}
              onChange={(e) => handleNameChange(activeLanguage, e.target.value)}
              dir={activeLanguage === "ar" ? "rtl" : "ltr"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-description" className="text-base">
              Section description ({activeLanguage})
            </Label>
            <Textarea
              id="section-description"
              value={editedSection.description?.[activeLanguage] || ""}
              onChange={(e) => handleDescriptionChange(activeLanguage, e.target.value)}
              placeholder={
                activeLanguage === "en"
                  ? "e.g., Kick off your meal with our delicious small bites."
                  : "مثال: ابدأ وجبتك مع وجباتنا الخفيفة اللذيذة."
              }
              rows={3}
              dir={activeLanguage === "ar" ? "rtl" : "ltr"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-image" className="text-base">
              Image URL (optional)
            </Label>
            <Input
              id="section-image"
              value={editedSection.image || ""}
              onChange={(e) => handleImageChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />

            {!editedSection.image && (
              <div className="flex items-center justify-center border border-dashed rounded-lg h-24 mt-2">
                <Button variant="ghost" className="flex flex-col items-center gap-2">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Upload image</span>
                </Button>
              </div>
            )}

            {editedSection.image && (
              <div className="mt-2 border rounded-md overflow-hidden w-full max-w-xs h-24">
                <img
                  src={editedSection.image || "/placeholder.svg"}
                  alt={editedSection.name.en || "Section image"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=100&width=300"
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-base">Section visibility</Label>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-on-menu" className="cursor-pointer">
                Show on menu
              </Label>
              <Switch
                id="show-on-menu"
                checked={editedSection.visible !== false}
                onCheckedChange={handleVisibilityChange}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
