"use client"

import type React from "react"
import { useParams } from "next/navigation";

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const UPLOAD_ENDPOINT = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL ?? "http://localhost:3002/api/upload"
const UPLOAD_KEY = process.env.NEXT_PUBLIC_UPLOAD_ADMIN_KEY
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "http://localhost:3002"

const trimTrailingSlash = (value: string) => (value.endsWith("/") ? value.slice(0, -1) : value)
const normaliseObjectName = (value: string) => value.replace(/^restaurants\//, "")
const resolveImageUrl = (value: string) => {
  if (!value) return value
  if (value.startsWith("http")) return value
  const base = trimTrailingSlash(IMAGE_BASE_URL)
  const path = value.startsWith("/") ? value : `/images/${normaliseObjectName(value)}`
  return `${base}${path}`
}

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, altText: string, subdomain: string) => Promise<void>
  className?: string
  subdomain?: string
}

export function ImageUpload({
  onImageUpload,
  className,
 
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [altText, setAltText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
const params = useParams(); 
  const subdomain = params.subdomain; 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Create a preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Generate default alt text from filename
    const fileName = file.name.split(".")[0]
    setAltText(fileName.replace(/-|_/g, " "))
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    const resolvedSubdomain = subdomain?.trim().toLowerCase() || "default"
    let progressInterval: ReturnType<typeof setInterval> | null = null

    try {
      // Simulate upload progress while the network request is pending.
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + 10
          return next >= 90 ? 90 : next
        })
      }, 300)

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("altText", altText)
      formData.append("subdomain", resolvedSubdomain)

      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: UPLOAD_KEY ? { "x-upload-key": UPLOAD_KEY } : undefined,
      })

      if (!response.ok) {
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
        throw new Error(`Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      const rawUrl =
        result?.url ??
        result?.image?.url ??
        result?.objectName ??
        result?.path ??
        ""

      if (!rawUrl) {
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
        throw new Error("Upload response missing image url")
      }

      const imageUrl = resolveImageUrl(String(rawUrl))

      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      setUploadProgress(100)

      await onImageUpload(imageUrl, altText, resolvedSubdomain)

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFile(null)
        setPreview(null)
        setAltText("")
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 500)
    } catch (error) {
      console.error("Error uploading image:", error)
      setUploadProgress(0)
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreview(null)
    setAltText("")
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!preview ? (
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to upload an image</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
          <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      ) : (
        <div className="relative">
          <div className="relative aspect-video rounded-lg overflow-hidden border">
            <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="alt-text">Alt Text</Label>
            <Input
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this image"
            />
            <p className="text-xs text-gray-500">
              Alt text helps make your menu accessible to people using screen readers.
            </p>
          </div>

          

          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{uploadProgress}%</p>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !altText.trim()}>
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
