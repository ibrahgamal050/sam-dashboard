"use client"

import { useEffect, useState } from "react"
import { Check, ImageIcon, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface MenuItemProps {
  id: string
  name: {
    en: string
    ar?: string
  }
  description?: {
    en?: string
    ar?: string
  }
  price?: number
  image?: string
  dietary?: string[]
  variants?: {
    id: string
    name: string
    price: number
  }[]
}

interface EditMenuItemProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MenuItemProps
  onSave: (item: MenuItemProps) => void
}

export default function EditMenuItem({ open, onOpenChange, item, onSave }: EditMenuItemProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [hasPriceVariants, setHasPriceVariants] = useState(item?.variants && item.variants.length > 0)
  const [formData, setFormData] = useState<MenuItemProps>({
    ...item,
    variants: item.variants || [],
  })

  // Update form data when item changes
  useEffect(() => {
    setFormData({
      ...item,
      variants: item.variants || [],
    })
    setHasPriceVariants(item?.variants && item.variants.length > 0)
  }, [item])

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: any, language?: string) => {
    if (language) {
      const currentValue = formData[field as keyof MenuItemProps]
      const nextValue = (typeof currentValue === 'object' && currentValue !== null)
        ? currentValue
        : {}

      setFormData({
        ...formData,
        [field]: {
          ...(nextValue as Record<string, unknown>),
          [language]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [field]: value,
      })
    }
  }

  const handleDietaryToggle = (tag: string) => {
    const currentDietary = formData.dietary || []
    const newDietary = currentDietary.includes(tag) ? currentDietary.filter((t) => t !== tag) : [...currentDietary, tag]

    setFormData({
      ...formData,
      dietary: newDietary,
    })
  }

  const handleVariantChange = (id: string, field: string, value: any) => {
    const updatedVariants = formData.variants?.map((variant) => {
      if (variant.id === id) {
        return {
          ...variant,
          [field]: value,
        }
      }
      return variant
    })

    setFormData({
      ...formData,
      variants: updatedVariants,
    })
  }

  const addVariant = () => {
    const newVariant = {
      id: `variant-${Date.now()}`,
      name: "New Variant",
      price: 0,
    }

    setFormData({
      ...formData,
      variants: [...(formData.variants || []), newVariant],
    })
  }

  const removeVariant = (id: string) => {
    setFormData({
      ...formData,
      variants: formData.variants?.filter((variant) => variant.id !== id),
    })
  }

  const removeImage = () => {
    setFormData({
      ...formData,
      image: undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Menu Item: {formData.name.en}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
            <TabsTrigger value="ordering">Ordering</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name-en">Item Name (English) *</Label>
                <Input
                  id="name-en"
                  value={formData.name.en}
                  onChange={(e) => handleInputChange("name", e.target.value, "en")}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name-ar">Item Name (Arabic)</Label>
                <Input
                  id="name-ar"
                  value={formData.name.ar || ""}
                  onChange={(e) => handleInputChange("name", e.target.value, "ar")}
                  placeholder="Enter item name in Arabic"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-en">Description (English)</Label>
                <Textarea
                  id="description-en"
                  value={formData.description?.en || ""}
                  onChange={(e) => handleInputChange("description", e.target.value, "en")}
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-ar">Description (Arabic)</Label>
                <Textarea
                  id="description-ar"
                  value={formData.description?.ar || ""}
                  onChange={(e) => handleInputChange("description", e.target.value, "ar")}
                  placeholder="Enter item description in Arabic"
                  dir="rtl"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Dietary Labels</Label>
                <div className="flex flex-wrap gap-2">
                  {["vegetarian", "vegan", "gluten-free", "dairy-free", "spicy"].map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={formData.dietary?.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDietaryToggle(tag)}
                      className="capitalize"
                    >
                      {formData.dietary?.includes(tag) && <Check className="mr-1 h-4 w-4" />}
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-variants">Price Variants</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="price-variants"
                      checked={hasPriceVariants}
                      onCheckedChange={(checked) => {
                        setHasPriceVariants(checked)
                        if (!checked) {
                          setFormData({
                            ...formData,
                            variants: undefined,
                          })
                        } else if (!formData.variants?.length) {
                          addVariant()
                        }
                      }}
                    />
                    <Label htmlFor="price-variants">Enable</Label>
                  </div>
                </div>

                {!hasPriceVariants ? (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price || 0}
                      onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Variants</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                        Add Variant
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.variants?.map((variant) => (
                        <div key={variant.id} className="flex items-center space-x-2">
                          <Input
                            value={variant.name}
                            onChange={(e) => handleVariantChange(variant.id, "name", e.target.value)}
                            placeholder="Variant name"
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) =>
                              handleVariantChange(variant.id, "price", Number.parseFloat(e.target.value))
                            }
                            placeholder="0.00"
                            className="w-24"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(variant.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove variant</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Item Image</Label>
                {formData.image ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-md border">
                    <img
                      src={formData.image || "/placeholder.svg"}
                      alt={formData.name.en}
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={removeImage}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove image</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed">
                    <div className="flex flex-col items-center space-y-2 text-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        <Button type="button" variant="secondary" size="sm">
                          Upload Image
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="modifiers" className="pt-4">
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Modifiers functionality will be implemented in a future update.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="ordering" className="pt-4">
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Ordering functionality will be implemented in a future update.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
