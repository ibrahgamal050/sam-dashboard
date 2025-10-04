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
import { RestaurantsTable } from '@/components/dashboard/restaurants-table'

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


 







  if (isLoading) return <div className="text-center mt-8">Loading...</div>
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto p-6">
       <RestaurantsTable data={restaurants} />

    
    </div>
  )
}
