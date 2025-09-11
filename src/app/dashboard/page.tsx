'use client'
import Link from 'next/link'
import { PlusCircle, Edit, Trash2, Filter, Search } from 'lucide-react'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Restaurant {
  id: string
  nameEn: string
  nameAr: string
  coverImage: string
  subdomain: string
}

export default function RestaurantDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/restaurants')
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }
      const data = await response.json()
      setRestaurants(data)
    } catch (err) {
      setError('Error fetching restaurants')
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to fetch restaurants. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRestaurant = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/restaurants/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant')
      }
      const data = await response.json()
      setEditingRestaurant(data)
      setIsEditModalOpen(true)
    } catch (err) {
      setError('Error fetching restaurant')
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to fetch restaurant details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/restaurants/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete restaurant');
      }
      setRestaurants(restaurants.filter(restaurant => restaurant.id !== id));
      toast({
        title: "Success",
        description: "Restaurant deleted successfully.",
      })
    } catch (err) {
      setError('Error deleting restaurant');
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to delete restaurant. Please try again.",
        variant: "destructive",
      })
    }
  };

  const handleEdit = (restaurant: Restaurant) => {
    fetchRestaurant(restaurant.id)
  }

  const handleSaveEdit = async (updatedRestaurant: Restaurant) => {
    try {
      const response = await fetch(`/api/restaurants/${updatedRestaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRestaurant),
      })
      if (!response.ok) {
        throw new Error('Failed to update restaurant')
      }
      const data = await response.json()
      setRestaurants(restaurants.map(r => r.id === data.id ? data : r))
      setIsEditModalOpen(false)
      setEditingRestaurant(null)
      toast({
        title: "Success",
        description: "Restaurant updated successfully.",
      })
    } catch (err) {
      setError('Error updating restaurant')
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to update restaurant. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreate = async (newRestaurant: Omit<Restaurant, 'id'>) => {
    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRestaurant),
      })
      if (!response.ok) {
        throw new Error('Failed to create restaurant')
      }
      const data = await response.json()
      setRestaurants([...restaurants, data])
      setIsCreateModalOpen(false)
      toast({
        title: "Success",
        description: "New restaurant created successfully.",
      })
    } catch (err) {
      setError('Error creating restaurant')
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to create new restaurant. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredRestaurants = restaurants.filter(restaurant => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (restaurant.nameAr && restaurant.nameAr.toLowerCase().includes(searchTermLower)) ||
      (restaurant.subdomain && restaurant.subdomain.toLowerCase().includes(searchTermLower))
    );
  });

  if (isLoading) return <div className="text-center mt-8">Loading...</div>
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-gray-800">Restaurants</h1>
        <p className="text-gray-500">Manage all your restaurant locations in one place.</p>
      </header>

      <div className="flex justify-between mb-6">
        <Button variant="outline" className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
          <PlusCircle className="h-5 w-5" />
          Add New Restaurant
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <Card key={restaurant.id} className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">{restaurant.nameAr}</CardTitle>
              <div className="absolute top-2 right-2 space-x-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(restaurant)}>
                  <Edit className="h-5 w-5 text-blue-500 hover:text-blue-700" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(restaurant.id)}>
                  <Trash2 className="h-5 w-5 text-red-500 hover:text-red-700" />
                </Button>
              </div>
            </CardHeader>
            <Link href={`/dashboard/${restaurant.subdomain}`} passHref>
              <CardContent>
                <p className="text-sm text-gray-500">{restaurant.nameEn} - {restaurant.nameAr}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
          </DialogHeader>
          {editingRestaurant && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSaveEdit({
                ...editingRestaurant,
                nameAr: formData.get('name') as string,
                location: formData.get('location') as string,
                subdomain: formData.get('url') as string,
              })
            }}>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input id="name" name="name" type="text" defaultValue={editingRestaurant.nameAr} />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" type="text" defaultValue={editingRestaurant.subdomain} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
