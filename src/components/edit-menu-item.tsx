"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Check, ImageIcon, Trash2, Upload, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { zodFormResolver } from "@/lib/zod-form-resolver"

// Define the schema for form validation
const menuItemSchema = z.object({
  name: z.object({
    en: z.string().min(1, "English name is required"),
    ar: z.string().optional(),
  }),
  description: z
    .object({
      en: z.string().optional(),
      ar: z.string().optional(),
    })
    .optional(),
  price: z.number().min(0, "Price must be a positive number").optional(),
  image: z.string().optional(),
  dietary: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Variant name is required"),
        price: z.number().min(0, "Price must be a positive number"),
      }),
    )
    .optional(),
})

type MenuItemFormValues = z.infer<typeof menuItemSchema>

export interface MenuItemProps {
  id: string
  name: {
    en: string
    ar: string
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
  availableDietaryOptions?: { id: string; label: string; icon?: string }[]
}

export default function EditMenuItem({
  open,
  onOpenChange,
  item,
  onSave,
  availableDietaryOptions = [
    { id: "vegetarian", label: "Vegetarian", icon: "🥦" },
    { id: "vegan", label: "Vegan", icon: "🌱" },
    { id: "gluten-free", label: "Gluten Free", icon: "🌾" },
    { id: "dairy-free", label: "Dairy Free", icon: "🥛" },
    { id: "spicy", label: "Spicy", icon: "🌶️" },
    { id: "nuts", label: "Contains Nuts", icon: "🥜" },
  ],
}: EditMenuItemProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [hasPriceVariants, setHasPriceVariants] = useState(item?.variants && item.variants.length > 0)
  const [imagePreview, setImagePreview] = useState<string | undefined>(item.image)
  const [isUploading, setIsUploading] = useState(false)

  // Initialize the form with react-hook-form
  const form = useForm<MenuItemFormValues>({
    resolver: zodFormResolver<MenuItemFormValues>(menuItemSchema),
    defaultValues: {
      name: {
        en: item.name.en,
        ar: item.name.ar || "",
      },
      description: {
        en: item.description?.en || "",
        ar: item.description?.ar || "",
      },
      price: item.price || 0,
      image: item.image,
      dietary: item.dietary || [],
      variants: item.variants || [],
    },
  })

  // Update form when item changes
  useEffect(() => {
    if (item) {
      form.reset({
        name: {
          en: item.name.en,
          ar: item.name.ar || "",
        },
        description: {
          en: item.description?.en || "",
          ar: item.description?.ar || "",
        },
        price: item.price || 0,
        image: item.image,
        dietary: item.dietary || [],
        variants: item.variants || [],
      })
      setHasPriceVariants(item.variants && item.variants.length > 0)
      setImagePreview(item.image)
    }
  }, [item, form])

  const handleSave = (data: MenuItemFormValues) => {
    // Combine form data with the original item id
    const updatedItem = {
      ...data,
      id: item.id,
    } as MenuItemProps

    // If price variants are disabled, remove variants
    if (!hasPriceVariants) {
      updatedItem.variants = undefined
    }

    onSave(updatedItem)
    onOpenChange(false)
  }

  const handleDietaryToggle = (tag: string) => {
    const currentDietary = form.getValues("dietary") || []
    const newDietary = currentDietary.includes(tag) ? currentDietary.filter((t) => t !== tag) : [...currentDietary, tag]

    form.setValue("dietary", newDietary, { shouldValidate: true })
  }

  const addVariant = () => {
    const currentVariants = form.getValues("variants") || []
    const newVariant = {
      id: `variant-${Date.now()}`,
      name: "New Variant",
      price: 0,
    }

    form.setValue("variants", [...currentVariants, newVariant], { shouldValidate: true })
  }

  const removeVariant = (id: string) => {
    const currentVariants = form.getValues("variants") || []
    form.setValue(
      "variants",
      currentVariants.filter((variant) => variant.id !== id),
      { shouldValidate: true },
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simulate image upload
    setIsUploading(true)

    // Create a preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const preview = event.target?.result as string
      setImagePreview(preview)

      // Simulate upload delay
      setTimeout(() => {
        form.setValue("image", preview, { shouldValidate: true })
        setIsUploading(false)
      }, 1500)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(undefined)
    form.setValue("image", undefined, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Menu Item: {item.name.en}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
                <TabsTrigger value="ordering">Ordering</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="name-en">Item Name (English) *</FormLabel>
                        <FormControl>
                          <Input id="name-en" placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name.ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="name-ar">Item Name (Arabic)</FormLabel>
                        <FormControl>
                          <Input id="name-ar" placeholder="Enter item name in Arabic" dir="rtl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="description-en">Description (English)</FormLabel>
                        <FormControl>
                          <Textarea id="description-en" placeholder="Enter item description" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description.ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="description-ar">Description (Arabic)</FormLabel>
                        <FormControl>
                          <Textarea
                            id="description-ar"
                            placeholder="Enter item description in Arabic"
                            dir="rtl"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Dietary Labels</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableDietaryOptions.map((option) => (
                        <TooltipProvider key={option.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={form.getValues("dietary")?.includes(option.id) ? "default" : "outline-solid"}
                                size="sm"
                                onClick={() => handleDietaryToggle(option.id)}
                                className="capitalize"
                              >
                                {option.icon && <span className="mr-1">{option.icon}</span>}
                                {form.getValues("dietary")?.includes(option.id) && <Check className="mr-1 h-4 w-4" />}
                                {option.label}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark this item as {option.label.toLowerCase()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                              form.setValue("variants", undefined)
                            } else if (!form.getValues("variants")?.length) {
                              addVariant()
                            }
                          }}
                        />
                        <Label htmlFor="price-variants">Enable</Label>
                      </div>
                    </div>

                    {!hasPriceVariants ? (
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="price">Price *</FormLabel>
                            <FormControl>
                              <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Variants</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                            Add Variant
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {form.getValues("variants")?.map((variant, index) => (
                            <div key={variant.id} className="flex items-center space-x-2">
                              <Input
                                value={variant.name}
                                onChange={(e) => {
                                  const updatedVariants = [...(form.getValues("variants") || [])]
                                  updatedVariants[index].name = e.target.value
                                  form.setValue("variants", updatedVariants, { shouldValidate: true })
                                }}
                                placeholder="Variant name"
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={variant.price}
                                onChange={(e) => {
                                  const updatedVariants = [...(form.getValues("variants") || [])]
                                  updatedVariants[index].price = Number(e.target.value)
                                  form.setValue("variants", updatedVariants, { shouldValidate: true })
                                }}
                                placeholder="0.00"
                                className="w-24"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariant(variant.id)}
                              >
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
                    {imagePreview ? (
                      <div className="relative h-40 w-full overflow-hidden rounded-md border">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt={form.getValues("name.en")}
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
                            <label htmlFor="image-upload" className="cursor-pointer">
                              <Button type="button" variant="secondary" size="sm" disabled={isUploading}>
                                {isUploading ? "Uploading..." : "Upload Image"}
                                {isUploading ? null : <Upload className="ml-2 h-4 w-4" />}
                              </Button>
                              <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="modifiers" className="pt-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Coming Soon</AlertTitle>
                  <AlertDescription>
                    Modifiers functionality will be implemented in a future update. This will allow you to add options
                    like sizes, toppings, and add-ons.
                  </AlertDescription>
                </Alert>
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed mt-4">
                  <p className="text-sm text-muted-foreground">
                    Modifiers functionality will be implemented in a future update.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="ordering" className="pt-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Coming Soon</AlertTitle>
                  <AlertDescription>
                    Ordering functionality will be implemented in a future update. This will allow you to configure
                    availability, ordering rules, and more.
                  </AlertDescription>
                </Alert>
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed mt-4">
                  <p className="text-sm text-muted-foreground">
                    Ordering functionality will be implemented in a future update.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6 flex justify-between sm:justify-between">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
