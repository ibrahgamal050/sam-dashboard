'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddRestaurant() {
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const restaurantData = {
      nameEn,
      nameAr,
      cuisine,
      subdomain,
      location,
    }

    try {
      const res = await fetch(`/api/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      })

      if (res.ok) {
        setMessage('Restaurant added successfully!')
        setNameEn('')
        setNameAr('')
        setSubdomain('')
        setCuisine('')
        setLocation('')
      } else {
        setMessage('Failed to add restaurant')
      }
    } catch (error) {
      setMessage('Error occurred while adding restaurant')
      console.error('Error adding restaurant:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Add a Restaurant</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nameEn">Name (English):</Label>
          <Input
            id="nameEn"
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameAr">Name (Arabic):</Label>
          <Input
            id="nameAr"
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomain:</Label>
          <Input
            id="subdomain"
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine:</Label>
          <Input
            id="cuisine"
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location:</Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full">Add Restaurant</Button>
      </form>
      {message && (
        <div className={`mt-4 p-2 text-center rounded ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="alert">
          {message}
        </div>
      )}
    </div>
  )
}