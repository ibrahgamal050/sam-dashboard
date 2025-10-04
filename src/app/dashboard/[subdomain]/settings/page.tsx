"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

import { GeneralSection } from "@/components/dashboard/settings/general-section"
import { FulfillmentSection } from "@/components/dashboard/settings/fulfillment-section"
import type { IRestaurant } from "@/types/restaurant"

const DEFAULT_FULFILLMENT_SETTINGS = {
  allowDelivery: true,
  allowPickup: true,
  allowDineIn: true,
  autoCompleteAfterMinutes: 0,
  sendReadyNotification: true,
} as const

export default function SettingsPage() {
  const params = useParams()
  const subdomain = Array.isArray(params?.subdomain) ? params.subdomain[0] : params?.subdomain ?? ""
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("general")
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      if (!subdomain) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/restaurants/${subdomain}`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to load restaurant settings")
        }

        const restaurant = (await response.json()) as IRestaurant
        if (!isMounted) return

        setRestaurant(restaurant)
      } catch (loadError) {
        console.error(loadError)
        if (!isMounted) return
        setError("Unable to load settings from the server. Showing defaults.")
        toast({
          title: "Unable to load settings",
          description: "Using default values for now. Try again once the connection is restored.",
          variant: "destructive",
        })
       
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [subdomain, toast])

  const handleRestaurantChange = (updates: Partial<IRestaurant>) => {
    setRestaurant((previous) => {
      if (!previous) return previous

      const next: IRestaurant = { ...previous, ...updates }

      if (updates.name) {
        next.name = { ...previous.name, ...updates.name }
      }

      if (updates.social) {
        next.social = { ...(previous.social ?? {}), ...updates.social }
      }

      if (updates.fulfillmentSettings) {
        next.fulfillmentSettings = {
          ...DEFAULT_FULFILLMENT_SETTINGS,
          ...(previous.fulfillmentSettings ?? {}),
          ...updates.fulfillmentSettings,
        }
      }

      if (updates.branches) {
        next.branches = updates.branches
      }

      if (updates.phones) {
        next.phones = updates.phones
      }

      return next
    })
  }

  const handleSave = async () => {
    if (!subdomain) {
      toast({
        title: "Subdomain missing",
        description: "We could not determine which restaurant to update.",
        variant: "destructive",
      })
      return
    }

    if (!restaurant) {
      toast({
        title: "Restaurant not loaded",
        description: "Please wait for the settings to finish loading before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/restaurants/${subdomain}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurant),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const updatedRestaurant = (await response.json()) as IRestaurant
      setRestaurant(updatedRestaurant)
      toast({
        title: "Settings saved",
        description: "Your changes were saved successfully.",
      })
    } catch (saveError) {
      console.error(saveError)
      setError("We couldn't save your changes. Please try again.")
      toast({
        title: "Save failed",
        description: "Please review your changes and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your restaurant settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoading || !restaurant}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-6">
          <GeneralSection
            restaurant={restaurant}
            onChange={handleRestaurantChange}
          />
        </TabsContent>
        <TabsContent value="fulfillment" className="space-y-6">
          <FulfillmentSection restaurant={restaurant} onChange={handleRestaurantChange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
