'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { zodFormResolver } from '@/lib/zod-form-resolver'

// This would typically be in a separate file
const restaurantSchema = z.object({
  nameEn: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  nameAr: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  subdomain: z.string().min(2, { message: 'Subdomain must be at least 2 characters.' }),
  cuisineEn: z.string(),
  cuisineAr: z.string(),
  locationEn: z.string(),
  locationAr: z.string(),
  logo: z.string().url({ message: 'Must be a valid URL.' }),
  coverImage: z.string().url({ message: 'Must be a valid URL.' }),
  themeColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Must be a valid hex color.' }),
  active: z.boolean(),
})

type RestaurantFormValues = z.infer<typeof restaurantSchema>

// This would typically come from an API call
const mockFetchRestaurant = async (id: string) => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    _id: id,
    nameEn: 'Hadramot Antard',
    nameAr: 'حضرموت عنتر  ‏',
    subdomain: 'hadramotantar',
    cuisineEn: 'المطعم اليمني',
    cuisineAr: 'المطعم اليمني',
    locationEn: 'جمال عبد الناصر - جسر السويس التجمع الخامس - مجمع البنوك العبور - جمعية عرابي , Cairo, Egypt',
    locationAr: 'جمال عبد الناصر - جسر السويس التجمع الخامس - مجمع البنوك العبور - جمعية عرابي , Cairo, Egypt',
    logo: '/placeholder.svg?height=100&width=100',
    coverImage: '/placeholder.svg?height=400&width=800',
    themeColor: '#000000',
    active: true,
  }
}

// This would typically be an API call
const mockUpdateRestaurant = async (id: string, data: RestaurantFormValues) => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Updated restaurant:', { id, ...data })
  return { success: true }
}

export function BlockPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<RestaurantFormValues>({
    resolver: zodFormResolver<RestaurantFormValues>(restaurantSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      subdomain: '',
      cuisineEn: '',
      cuisineAr: '',
      locationEn: '',
      locationAr: '',
      logo: '',
      coverImage: '',
      themeColor: '',
      active: false,
    },
  })

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await mockFetchRestaurant(params.restaurantId as string)
        form.reset(data)
      } catch (error) {
        console.error('Failed to fetch restaurant:', error)
        toast({
          title: 'Error',
          description: 'Failed to load restaurant data. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurant()
  }, [params.restaurantId, form, toast])

  const onSubmit = async (data: RestaurantFormValues) => {
    try {
      setIsLoading(true)
      await mockUpdateRestaurant(params.restaurantId as string, data)
      toast({
        title: 'Success',
        description: 'Restaurant information updated successfully.',
      })
      router.push('/dashboard') // Redirect to dashboard after successful update
    } catch (error) {
      console.error('Failed to update restaurant:', error)
      toast({
        title: 'Error',
        description: 'Failed to update restaurant information. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Edit Restaurant Information</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter restaurant name in English" {...field} />
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
                    <Input placeholder="Enter restaurant name in Arabic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subdomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subdomain</FormLabel>
                <FormControl>
                  <Input placeholder="Enter subdomain" {...field} />
                </FormControl>
                <FormDescription>This will be used for your restaurant&apos;s URL.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cuisineEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuisine (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter cuisine type in English" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuisineAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuisine (Arabic)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter cuisine type in Arabic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="locationEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (English)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter location in English" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Arabic)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter location in Arabic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter logo URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter cover image URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="themeColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme Color</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Input type="color" className="h-10 w-14" {...field} />
                    <Input
                      placeholder="Enter hex color code"
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={e => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>This restaurant will be visible to customers when active.</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  )
}
