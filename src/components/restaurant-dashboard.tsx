'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Filter, Trash2, Edit } from "lucide-react"

interface Restaurant {
  id: string
  name: string
  location: string
  url: string
}

export function RestaurantDashboardComponent() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    { id: "1", name: "Downtown Restaurant", location: "Downtown", url: "https://restaurant-downtown.com" },
    { id: "2", name: "Uptown Restaurant", location: "Uptown", url: "https://restaurant-uptown.com" },
    { id: "3", name: "Riverside Restaurant", location: "Riverside", url: "https://restaurant-riverside.com" },
  ])

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)

  const handleDelete = (id: string) => {
    setRestaurants(restaurants.filter(restaurant => restaurant.id !== id))
  }

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = (updatedRestaurant: Restaurant) => {
    setRestaurants(restaurants.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r))
    setIsEditModalOpen(false)
    setEditingRestaurant(null)
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Restaurants</h1>
        <p className="text-muted-foreground">Manage all your restaurant locations in one place.</p>
      </header>
      
      <div className="flex justify-between mb-6">
        <div className="space-x-2">
          <Button variant="outline">Create New Location</Button>
          <Button>Add New Menu</Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Input type="search" placeholder="Search..." className="w-64" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader className="relative">
              <CardTitle className="text-lg">{restaurant.name}</CardTitle>
              <div className="absolute top-2 right-2 space-x-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(restaurant)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(restaurant.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <img
                src={`/placeholder.svg?height=100&width=200&text=${restaurant.location}`}
                alt={`${restaurant.name}`}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <p className="text-sm text-muted-foreground">{restaurant.url}</p>
            </CardContent>
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
                name: formData.get('name') as string,
                location: formData.get('location') as string,
                url: formData.get('url') as string,
              })
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" name="name" defaultValue={editingRestaurant.name} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input id="location" name="location" defaultValue={editingRestaurant.location} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">
                    URL
                  </Label>
                  <Input id="url" name="url" defaultValue={editingRestaurant.url} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}