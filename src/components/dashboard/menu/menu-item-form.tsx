"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import type { MenuItem } from "@/lib/types"
import { Trash } from "lucide-react"

const formSchema = z.object({
  nameEn: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  nameAr: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  descriptionEn: z.string().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  image: z.string().optional(),
  sizes: z
    .array(
      z.object({
        nameEn: z.string(),
        nameAr: z.string(),
        price: z.string(),
      }),
    )
    .optional(),
})

interface MenuItemFormProps {
  restaurantId: string
  categoryId: string
  menuItem?: MenuItem
}

export function MenuItemForm({ restaurantId, categoryId, menuItem }: MenuItemFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVariablePricing, setHasVariablePricing] = useState(
    menuItem ? menuItem.price === null && (menuItem.sizes?.length || 0) > 0 : false,
  )

  // Convert sizes from MenuItem to form format
  const defaultSizes =
    menuItem?.sizes?.map((size) => ({
      nameEn: size.name.en,
      nameAr: size.name.ar,
      price: size.price.toString(),
    })) || []

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nameEn: menuItem?.name.en || "",
      nameAr: menuItem?.name.ar || "",
      descriptionEn: menuItem?.description?.en || "",
      descriptionAr: menuItem?.description?.ar || "",
      price: menuItem?.price !== null ? menuItem.price.toString() : "",
      image: menuItem?.image || "",
      sizes: defaultSizes.length > 0 ? defaultSizes : [{ nameEn: "", nameAr: "", price: "" }],
    },
  })

  const { fields, append, remove } = form.control._fields.sizes
    ? form.control._fields.sizes
    : { fields: [], append: () => {}, remove: () => {} }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // In a real app, you would call an API to create/update the menu item
      console.log("Form values:", values)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to category page
      router.push(`/dashboard/restaurants/${restaurantId}/menu/categories/${categoryId}`)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Item Information</CardTitle>
              <CardDescription>Enter the details for the menu item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Item name in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Arabic)</FormLabel>
                      <FormControl>
                        <Input placeholder="Item name in Arabic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (English)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Item description in English"
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descriptionAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Arabic)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Item description in Arabic"
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="variable-pricing"
                  checked={hasVariablePricing}
                  onChange={(e) => setHasVariablePricing(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="variable-pricing" className="text-sm font-medium">
                  This item has size variations with different prices
                </label>
              </div>

              {!hasVariablePricing && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (EGP)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Item price"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {hasVariablePricing && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Size Variations</h3>
                    <p className="text-xs text-muted-foreground">Add different sizes with their prices</p>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start space-x-2">
                      <div className="grid flex-1 gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`sizes.${index}.nameEn`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? "sr-only" : ""}>Size (English)</FormLabel>
                              <FormControl>
                                <Input placeholder="Size name in English" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`sizes.${index}.nameAr`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? "sr-only" : ""}>Size (Arabic)</FormLabel>
                              <FormControl>
                                <Input placeholder="Size name in Arabic" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`sizes.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? "sr-only" : ""}>Price (EGP)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Price" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-8"
                          onClick={() => remove(index)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Remove size</span>
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ nameEn: "", nameAr: "", price: "" })}
                  >
                    Add Size
                  </Button>
                </div>
              )}

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Image</FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-4">
                        <div className="flex h-40 w-full items-center justify-center rounded-md bg-muted">
                          {field.value ? (
                            <img
                              src={field.value || "/placeholder.svg"}
                              alt="Item image"
                              className="h-full w-full rounded-md object-cover"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">No image uploaded</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            // In a real app, this would open a file picker
                            console.log("Upload image clicked")
                          }}
                        >
                          Upload Image
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Upload an image for this menu item</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/restaurants/${restaurantId}/menu/categories/${categoryId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : menuItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
