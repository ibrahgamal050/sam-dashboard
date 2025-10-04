"use client"

import { useState } from "react"
import { Plus, X, ImagePlus } from "lucide-react"
import { Types } from "mongoose"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MenuImageManager } from "./menu-image-manager"
import type { IMenuItem, ISize, IMenuImage } from "@/types/menu"

interface EditItemModalProps {
  item: IMenuItem
  currency: {
    en?: string
    ar?: string
  }
  menuImages: IMenuImage[]
  onSave: (item: IMenuItem) => void
  onCancel: () => void
  onDelete: () => void
  onImagesChange?: (images: IMenuImage[]) => void
}

export function EditItemModal({
  item,
  currency,
  menuImages = [],
  onSave,
  onCancel,
  onDelete,
  onImagesChange,
}: EditItemModalProps) {
  const [editedItem, setEditedItem] = useState<IMenuItem>({ ...item })
  const [activeTab, setActiveTab] = useState("info")
  const [activeLanguage, setActiveLanguage] = useState<"en" | "ar">("en")
  const [hasSizes, setHasSizes] = useState(item.sizes && item.sizes.length > 0)
  const [newSize, setNewSize] = useState<ISize>({
    name: { en: "", ar: "" },
    price: 0,
  })
  const [imageManagerOpen, setImageManagerOpen] = useState(false)

  const handleChange = (field: string, value: any) => {
    setEditedItem({ ...editedItem, [field]: value })
  }

  const handleNameChange = (lang: "en" | "ar", value: string) => {
    setEditedItem({
      ...editedItem,
      name: {
        ...editedItem.name,
        [lang]: value,
      },
    })
  }

  const handleDescriptionChange = (lang: "en" | "ar", value: string) => {
    setEditedItem({
      ...editedItem,
      description: {
        ...editedItem.description,
        [lang]: value,
      },
    })
  }

  const handlePriceChange = (value: string) => {
    const numericValue = Number.parseFloat(value)
    if (!isNaN(numericValue)) {
      setEditedItem({
        ...editedItem,
        price: numericValue,
      })
    }
  }

  const handleSizeNameChange = (index: number, lang: "en" | "ar", value: string) => {
    const updatedSizes = [...(editedItem.sizes || [])]
    updatedSizes[index] = {
      ...updatedSizes[index],
      name: {
        ...updatedSizes[index].name,
        [lang]: value,
      },
    }
    setEditedItem({
      ...editedItem,
      sizes: updatedSizes,
    })
  }

  const handleSizePriceChange = (index: number, value: string) => {
    const numericValue = Number.parseFloat(value)
    if (!isNaN(numericValue)) {
      const updatedSizes = [...(editedItem.sizes || [])]
      updatedSizes[index] = {
        ...updatedSizes[index],
        price: numericValue,
      }
      setEditedItem({
        ...editedItem,
        sizes: updatedSizes,
      })
    }
  }

  const handleNewSizeNameChange = (lang: "en" | "ar", value: string) => {
    setNewSize({
      ...newSize,
      name: {
        ...newSize.name,
        [lang]: value,
      },
    })
  }

  const handleNewSizePriceChange = (value: string) => {
    const numericValue = Number.parseFloat(value)
    if (!isNaN(numericValue)) {
      setNewSize({
        ...newSize,
        price: numericValue,
      })
    }
  }

  const addSize = () => {
    if (newSize.name.en || newSize.name.ar) {
      const newSizeWithId = {
        ...newSize,
        _id: new Types.ObjectId().toString() as unknown as Types.ObjectId,
      }
      setEditedItem({
        ...editedItem,
        sizes: [...(editedItem.sizes || []), newSizeWithId],
      })
      setNewSize({
        name: { en: "", ar: "" },
        price: 0,
      })
    }
  }

  const removeSize = (index: number) => {
    const updatedSizes = [...(editedItem.sizes || [])]
    updatedSizes.splice(index, 1)
    setEditedItem({
      ...editedItem,
      sizes: updatedSizes,
    })
    if (updatedSizes.length === 0) {
      setHasSizes(false)
    }
  }

  const toggleHasSizes = (checked: boolean) => {
    setHasSizes(checked)
    if (!checked) {
      setEditedItem({
        ...editedItem,
        sizes: [],
      })
    }
  }

  const handleSelectImage = (image: IMenuImage) => {
    setEditedItem({
      ...editedItem,
      image: image.url,
    })
    setImageManagerOpen(false)
  }

  const handleSave = () => {
    // If we have sizes, remove the direct price
    if (hasSizes && editedItem.sizes && editedItem.sizes.length > 0) {
      const { price, ...itemWithoutPrice } = editedItem
      onSave(itemWithoutPrice)
    } else {
      // If we don't have sizes, ensure we have a price
      const itemWithoutSizes = {
        ...editedItem,
        sizes: [],
        price: editedItem.price || 0,
      }
      onSave(itemWithoutSizes)
    }
  }

  return (
    <>
      <Sheet open onOpenChange={(open) => {
        if (!open) onCancel()
      }}>
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white p-0 shadow-2xl"
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Edit item details</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {editedItem.name.en || editedItem.name.ar || "New Item"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200 px-4"
                onClick={() => setActiveLanguage(activeLanguage === "en" ? "ar" : "en")}
              >
                {activeLanguage === "en" ? "العربية" : "English"}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-6">
              <TabsList className="grid h-12 w-full grid-cols-3 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="info"
                  className="rounded-none border-b-2 border-transparent px-0 text-sm font-medium text-slate-500 transition data-[state=active]:border-[#2e6fe6] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
                >
                  Info
                </TabsTrigger>
                <TabsTrigger
                  value="sizes"
                  className="rounded-none border-b-2 border-transparent px-0 text-sm font-medium text-slate-500 transition data-[state=active]:border-[#2e6fe6] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
                >
                  Sizes
                </TabsTrigger>
                <TabsTrigger
                  value="image"
                  className="rounded-none border-b-2 border-transparent px-0 text-sm font-medium text-slate-500 transition data-[state=active]:border-[#2e6fe6] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
                >
                  Image
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info" className="mt-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <section className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Item details</p>
                  <p className="text-sm text-slate-500">
                    Update the name, description, and pricing shown to guests.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-name" className="text-sm font-semibold text-slate-700">
                    Item name ({activeLanguage}) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="item-name"
                    value={editedItem.name[activeLanguage] || ""}
                    onChange={(e) => handleNameChange(activeLanguage, e.target.value)}
                    dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-description" className="text-sm font-semibold text-slate-700">
                    Item description ({activeLanguage})
                  </Label>
                  <Textarea
                    id="item-description"
                    value={editedItem.description?.[activeLanguage] || ""}
                    onChange={(e) => handleDescriptionChange(activeLanguage, e.target.value)}
                    rows={4}
                    dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="item-price" className="text-sm font-semibold text-slate-700">
                        Pricing <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-xs text-slate-500">Set a single price or switch to variants per size.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="price-per-variant" checked={hasSizes} onCheckedChange={toggleHasSizes} />
                      <Label htmlFor="price-per-variant" className="text-xs text-slate-500">
                        Set price per size
                      </Label>
                    </div>
                  </div>

                  {!hasSizes && (
                    <div className="flex items-center gap-3">
                      <Input
                        id="item-price"
                        type="number"
                        value={editedItem.price || ""}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="h-11 max-w-[200px] rounded-xl"
                      />
                      <span className="text-base font-medium text-slate-600">
                        {currency[activeLanguage] || currency.en}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="sizes" className="mt-0 flex-1 overflow-y-auto px-6 py-6">
              {hasSizes ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Item sizes</h3>
                    <p className="text-sm text-slate-500">Define the available variants and their pricing.</p>
                  </div>

                  {editedItem.sizes && editedItem.sizes.length > 0 ? (
                    <div className="space-y-4">
                      {editedItem.sizes.map((size, index) => (
                        <div
                          key={size._id?.toString() || index}
                          className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex-1 space-y-2">
                            <Label className="text-xs font-semibold text-slate-500">
                              Size name ({activeLanguage})
                            </Label>
                            <Input
                              value={size.name[activeLanguage] || ""}
                              onChange={(e) => handleSizeNameChange(index, activeLanguage, e.target.value)}
                              dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                            />
                          </div>
                          <div className="w-32 space-y-2">
                            <Label className="text-xs font-semibold text-slate-500">Price</Label>
                            <Input
                              type="number"
                              value={size.price || ""}
                              onChange={(e) => handleSizePriceChange(index, e.target.value)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-500"
                            onClick={() => removeSize(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
                      No sizes added yet.
                    </div>
                  )}

                  <div className="flex items-end gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">
                        New size name ({activeLanguage})
                      </Label>
                      <Input
                        value={newSize.name[activeLanguage] || ""}
                        onChange={(e) => handleNewSizeNameChange(activeLanguage, e.target.value)}
                        dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                        placeholder={`Size name in ${activeLanguage === "en" ? "English" : "Arabic"}`}
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">Price</Label>
                      <Input
                        type="number"
                        value={newSize.price || ""}
                        onChange={(e) => handleNewSizePriceChange(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <Button variant="outline" size="icon" className="rounded-full" onClick={addSize}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
                  Enable "Set price per size" from the Info tab to manage variants.
                </div>
              )}
            </TabsContent>

            <TabsContent value="image" className="mt-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Imagery</p>
                    <p className="text-sm text-slate-500">Upload or pick a photo to highlight this item.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200"
                    onClick={() => setImageManagerOpen(true)}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" /> Browse images
                  </Button>
                </div>

                {editedItem.image ? (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                    <div className="aspect-video w-full bg-slate-100">
                      <img
                        src={editedItem.image || "/placeholder.svg"}
                        alt={editedItem.name.en || "Item image"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                        }}
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 text-slate-700 hover:bg-white"
                        onClick={() => handleChange("image", "")}
                      >
                        Remove image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500"
                    onClick={() => setImageManagerOpen(true)}
                  >
                    <ImagePlus className="h-8 w-8 text-slate-400" />
                    <p>Click to select an image</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={onDelete}>
              Delete item
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-[#2e6fe6] hover:bg-[#2357b9]">
                Save
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <MenuImageManager
        open={imageManagerOpen}
        onOpenChange={setImageManagerOpen}
        images={menuImages}
        subdomain="abdoelgazar"
        onImagesChange={onImagesChange ?? (() => {})}
        onSelectImage={handleSelectImage}
      />
    </>
  )
}
