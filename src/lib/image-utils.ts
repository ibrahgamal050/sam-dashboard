/**
 * Utility helpers for uploading and deleting menu images from the dashboard.
 * These functions run in the browser and talk to the Next.js upload API.
 */
export async function uploadImage(file: File, altText: string, subdomain = "default"): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("altText", altText)
  formData.append("subdomain", subdomain)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    let message = "Failed to upload image"

    try {
      const error = await response.json()
      if (error?.message) {
        message = error.message as string
      }
    } catch (parseError) {
      // Ignore JSON parse errors – the default message is good enough.
    }

    throw new Error(message)
  }

  const data = (await response.json()) as { image?: { url?: string } }
  const url = data?.image?.url

  if (!url) {
    throw new Error("Upload response did not include an image URL")
  }

  return url
}

export async function deleteImage(imageUrl: string): Promise<void> {
  const response = await fetch("/api/upload", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  })

  if (!response.ok) {
    let message = "Failed to delete image"

    try {
      const error = await response.json()
      if (error?.message) {
        message = error.message as string
      }
    } catch (parseError) {
      // Ignore JSON parse errors – keep the default message.
    }

    throw new Error(message)
  }
}
