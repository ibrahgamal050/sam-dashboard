'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'

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

const restaurantSchema = z.object({
  nameEn: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  nameAr: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  subdomain: z.string().min(2, { message: 'Subdomain must be at least 2 characters.' }),
  cuisineEn: z.string(),
  cuisineAr: z.string(),
  locationEn: z.string(),
  locationAr: z.string(),
  logo: z.string(),
  hotline: z.string(),
  themeColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Must be a valid hex color.' }),
  active: z.boolean(),
})

type RestaurantFormValues = z.infer<typeof restaurantSchema>

const fetchRestaurant = async (subdomain: string) => {
  try {
    console.time('fetchRestaurant')
    const response = await fetch(`/api/restaurants/${subdomain}`)
    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }
    const data = await response.json()
    console.timeEnd('fetchRestaurant')
    return data
  } catch (error) {
    console.error('Failed to fetch restaurant:', error)
    throw error
  }
}

export default function EditRestaurantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  
  // Use useParams to fetch dynamic params like subdomain
  const { subdomain } = useParams<{ subdomain: string }>() 
  
  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      subdomain: '',
      cuisineEn: '',
      cuisineAr: '',
      locationEn: '',
      locationAr: '',
      logo: '',
      hotline: '',
      themeColor: '',
      active: false,
    },
  })

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (subdomain) {
        try {
          const data = await fetchRestaurant(subdomain)
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
    }

    fetchRestaurantData()
  }, [subdomain, form, toast])
  const mockUpdateRestaurant = async (subdomain: string, data: RestaurantFormValues) => {
    try {
      const response = await fetch(`/api/restaurants/${subdomain}`, {
        method: 'PUT', // or 'PATCH' depending on your API
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update restaurant')
      }
  
      return await response.json() // Return the updated data if needed
    } catch (error) {
      console.error('Error updating restaurant:', error)
      throw error
    }
  }
  
  const onSubmit = async (data: RestaurantFormValues) => {
    try {
      setIsLoading(true)
      await mockUpdateRestaurant(subdomain, data)
      toast({
        title: 'Success',
        description: 'Restaurant information updated successfully.',
      })
      router.push('/dashboard')
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
              name="hotline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>hotline</FormLabel>
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
                  <Input placeholder="Enter theme color" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Active</FormLabel>
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
