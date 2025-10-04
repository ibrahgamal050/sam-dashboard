"use client"

import { type ChangeEvent, useEffect, useRef, useState } from "react"
import { Building, Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

import type { IRestaurant } from "@/types/restaurant"

const UPLOAD_ENDPOINT = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL ?? "http://localhost:3002/api/upload"
const UPLOAD_KEY = process.env.NEXT_PUBLIC_UPLOAD_ADMIN_KEY
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "http://localhost:3002"

const trimTrailingSlash = (value: string) => (value.endsWith("/") ? value.slice(0, -1) : value)
const resolveImageUrl = (value: string | null) => {
  if (!value) return null
  if (value.startsWith("http")) return value
  const base = trimTrailingSlash(IMAGE_BASE_URL)
  const path = value.startsWith("/") ? value : `/images/${value}`
  return `${base}${path}`
}

interface GeneralSectionProps {
  restaurant: IRestaurant | null
  onChange: (updates: Partial<IRestaurant>) => void
}

export function GeneralSection({ restaurant, onChange }: GeneralSectionProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant?.logo ?? null)
  const [logoFileName, setLogoFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (restaurant?.logo) {
      setLogoPreview((prev) => (prev === restaurant.logo ? prev : restaurant.logo))
      setLogoFileName(null)
    } else {
      setLogoPreview(null)
      setLogoFileName(null)
    }
  }, [restaurant?.logo])

  if (!restaurant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const uploadLogo = async (file: File) => {
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    if (restaurant.subdomain) {
      formData.append("subdomain", restaurant.subdomain.toLowerCase())
    }

    setIsUploading(true)

    try {
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: UPLOAD_KEY ? { "x-upload-key": UPLOAD_KEY } : undefined,
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      if (!result?.ok || !result?.objectName) {
        throw new Error("Upload response missing object name")
      }

      const objectName = String(result.objectName)
      const relativePath = objectName.replace(/^restaurants\//, "")

      setLogoPreview(relativePath)
      setLogoFileName(file.name)
      onChange({ logo: relativePath })

      toast({ title: "Logo uploaded", description: "The restaurant logo has been updated." })
    } catch (error) {
      console.error("Logo upload failed", error)
      toast({
        title: "Upload failed",
        description: "We couldn't upload the logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    void uploadLogo(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="mr-2 h-5 w-5" />
          Restaurant Information
        </CardTitle>
        <CardDescription>Basic information about your restaurant</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="restaurantNameAr">Restaurant Name (AR)</Label>
            <Input
              id="restaurantNameAr"
              value={restaurant.name.ar}
              onChange={(e) =>
                onChange({
                  name: { ...(restaurant.name ?? { ar: "", en: "" }), ar: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurantNameEn">Restaurant Name (EN)</Label>
            <Input
              id="restaurantNameEn"
              value={restaurant.name.en}
              onChange={(e) =>
                onChange({
                  name: { ...(restaurant.name ?? { ar: "", en: "" }), en: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="restaurantSubdomain">Website / Subdomain</Label>
            <Input
              id="restaurantSubdomain"
              value={restaurant.subdomain}
              onChange={(e) => onChange({ subdomain: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Primary Phone Number</Label>
            <Input
              id="phone"
              value={restaurant.phones?.[0] ?? ""}
              onChange={(e) =>
                onChange({ phones: [e.target.value, ...(restaurant.phones?.slice(1) ?? [])] })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={restaurant.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Brief description of your restaurant"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Restaurant Logo</Label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {logoPreview ? (
                <img
                  src={resolveImageUrl(logoPreview) ?? ''}
                  alt="Restaurant logo preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <Button
              variant="outline"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploading ? "Uploading" : logoFileName ?? "Upload"}
            </Button>

            {logoPreview && (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setLogoPreview(null)
                  setLogoFileName(null)
                  onChange({ logo: "" })
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
