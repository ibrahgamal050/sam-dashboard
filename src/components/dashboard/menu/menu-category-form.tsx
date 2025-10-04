"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import type { MenuCategory } from "@/lib/types"

const formSchema = z.object({
  nameEn: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  nameAr: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  image: z.string().optional(),
})

interface MenuCategoryFormProps {
  restaurantId: string
  category?: MenuCategory
}

export function MenuCategoryForm({ restaurantId, category }: MenuCategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nameEn: category?.name.en || "",
      nameAr: category?.name.ar || "",
      image: category?.image || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // In a real app, you would call an API to create/update the category
      console.log("Form values:", values)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to menu page
      router.push(`/dashboard/restaurants/${restaurantId}/menu`)
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
              <CardTitle>Category Information</CardTitle>
              <CardDescription>Enter the details for the menu category</CardDescription>
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
                        <Input placeholder="Category name in English" {...field} />
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
                        <Input placeholder="Category name in Arabic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Image</FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-4">
                        <div className="flex h-40 w-full items-center justify-center rounded-md bg-muted">
                          {field.value ? (
                            <img
                              src={field.value || "/placeholder.svg"}
                              alt="Category image"
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
                    <FormDescription>Upload an image to represent this category</FormDescription>
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
              onClick={() => router.push(`/dashboard/restaurants/${restaurantId}/menu`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : category ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
