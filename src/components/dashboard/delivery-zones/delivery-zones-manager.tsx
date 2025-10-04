"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Map, Plus, RefreshCw } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { DeliveryZoneForm } from "./delivery-zone-form"
import { DeliveryZoneMap, type DeliveryZoneMapHandle } from "./delivery-zone-map"
import { DeliveryZoneTable } from "./delivery-zone-table"
import { useI18n } from "@/hooks/use-i18n"
import type { DeliveryZoneDTO, IGeoJSONPolygon } from "@/types/delivery-zone"
import type { SupportedLanguage } from "@/i18n"
import { closePolygonRings } from "@/lib/geo/normalize-polygon"
import { cn } from "@/lib/utils"

interface DeliveryZonesManagerProps {
  restaurantId: string
  initialZones: DeliveryZoneDTO[]
  mapboxToken?: string
  locale?: SupportedLanguage
  adminToken?: string
}

type DialogMode = "create" | "edit"

export function DeliveryZonesManager({ restaurantId, initialZones, mapboxToken, locale = "en", adminToken }: DeliveryZonesManagerProps) {
  const mapRef = useRef<DeliveryZoneMapHandle | null>(null)
  const [zones, setZones] = useState<DeliveryZoneDTO[]>(() => [...initialZones])
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [pendingGeometry, setPendingGeometry] = useState<IGeoJSONPolygon | null>(null)
  const [activeZone, setActiveZone] = useState<DeliveryZoneDTO | null>(null)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState<DeliveryZoneDTO | null>(null)
  const [token, setToken] = useState<string | undefined>(adminToken)
  const { toast } = useToast()
  const { t, language, setLanguage } = useI18n(locale)

  useEffect(() => {
    setLanguage(locale)
  }, [locale, setLanguage])

  useEffect(() => {
    if (!token) {
      const clientToken = readTokenFromCookies()
      if (clientToken) setToken(clientToken)
    }
  }, [token])

  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bDate - aDate
    })
  }, [zones])

  const ensureAuthToken = useCallback(() => {
    const currentToken = token || readTokenFromCookies()
    if (!currentToken) {
      toast({
        variant: "destructive",
        title: t("toastError"),
        description: t("insufficientPermissions"),
      })
      return null
    }
    if (!token) setToken(currentToken)
    return currentToken
  }, [t, toast, token])

  const handleCreateClick = () => {
    setDialogMode("create")
    setPendingGeometry(null)
    setActiveZone(null)
    setDialogOpen(true)
    setSelectedZoneId(null)
    queueMicrotask(() => {
      mapRef.current?.startDrawingPolygon()
    })
  }

  const handleEditZone = (zone: DeliveryZoneDTO) => {
    setDialogMode("edit")
    setActiveZone(zone)
    setSelectedZoneId(zone.id)
    setPendingGeometry(zone.geometry)
    setDialogOpen(true)
    queueMicrotask(() => {
      mapRef.current?.loadZoneForEditing(zone)
    })
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setActiveZone(null)
      setPendingGeometry(null)
      mapRef.current?.clearDraft()
    }
  }

  const handlePolygonCreated = (geometry: IGeoJSONPolygon) => {
    setPendingGeometry(geometry)
  }

  const handlePolygonUpdated = (geometry: IGeoJSONPolygon) => {
    setPendingGeometry(geometry)
  }

  const handleFormSubmit = async (values: { name: string; fee: number; minOrder: number; active: boolean; geometry: IGeoJSONPolygon }) => {
    const authToken = ensureAuthToken()
    if (!authToken) return

    setSaving(true)
    try {
      const payload = {
        restaurantId,
        name: values.name,
        fee: values.fee,
        minOrder: values.minOrder,
        active: values.active,
        geometry: {
          type: "Polygon" as const,
          coordinates: closePolygonRings(values.geometry.coordinates ?? []),
        },
      }

      const response = await fetch(dialogMode === "create" ? "/api/delivery-zones" : `/api/delivery-zones/${activeZone?.id}`, {
        method: dialogMode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(
          dialogMode === "create"
            ? payload
            : {
                ...payload,
                id: activeZone?.id,
              },
        ),
      })

      if (!response.ok) {
        const error = await safeParseError(response)
        throw new Error(error ?? "Request failed")
      }

      const data = await response.json()
      const updatedZone: DeliveryZoneDTO | undefined = data.zone
      if (updatedZone) {
        setZones((prev) => {
          if (dialogMode === "create") {
            return [updatedZone, ...prev]
          }
          return prev.map((zone) => (zone.id === updatedZone.id ? updatedZone : zone))
        })
        toast({
          title: dialogMode === "create" ? t("toastCreateSuccess") : t("toastUpdateSuccess"),
        })
        setDialogOpen(false)
        mapRef.current?.clearDraft()
        setActiveZone(null)
        setPendingGeometry(null)
      }
    } catch (error) {
      console.error("Failed to save zone", error)
      toast({
        variant: "destructive",
        title: t("toastError"),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!zoneToDelete) return
    const authToken = ensureAuthToken()
    if (!authToken) return

    try {
      const response = await fetch(`/api/delivery-zones/${zoneToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      if (!response.ok) {
        const error = await safeParseError(response)
        throw new Error(error ?? "Request failed")
      }
      setZones((prev) => prev.filter((zone) => zone.id !== zoneToDelete.id))
      toast({ title: t("toastDeleteSuccess") })
      if (selectedZoneId === zoneToDelete.id) {
        setSelectedZoneId(null)
        mapRef.current?.clearDraft()
      }
    } catch (error) {
      console.error("Failed to delete zone", error)
      toast({ variant: "destructive", title: t("toastError") })
    } finally {
      setZoneToDelete(null)
    }
  }

  const handleRefresh = async () => {
    const authToken = ensureAuthToken()
    if (!authToken) return

    setRefreshing(true)
    try {
      const response = await fetch(`/api/delivery-zones?restaurantId=${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-store",
      })
      if (!response.ok) {
        const error = await safeParseError(response)
        throw new Error(error ?? "Request failed")
      }
      const data = await response.json()
      if (Array.isArray(data.zones)) {
        setZones(data.zones as DeliveryZoneDTO[])
      }
    } catch (error) {
      console.error("Failed to refresh zones", error)
      toast({ variant: "destructive", title: t("toastError") })
    } finally {
      setRefreshing(false)
    }
  }

  const handleZoneClickOnMap = (zoneId: string) => {
    const zone = zones.find((item) => item.id === zoneId)
    if (zone) {
      handleEditZone(zone)
    }
  }

  const mapUnavailable = !mapboxToken

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t("deliveryZonesTitle")}</CardTitle>
            <CardDescription>{t("deliveryZonesDescription")}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              {t("refreshZones")}
            </Button>
            <Button onClick={handleCreateClick} disabled={mapUnavailable}>
              <Plus className="mr-2 h-4 w-4" />
              {t("newZone")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mapUnavailable && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_TOKEN to enable map features.
              </AlertDescription>
            </Alert>
          )}

          {!mapUnavailable && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <Map className="h-4 w-4" />
                <span className="flex-1 min-w-[200px]">{t("drawingInstructions")}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => mapRef.current?.startDrawingPolygon()}
                >
                  {t("startDrawing")}
                </Button>
              </div>
              <DeliveryZoneMap
                ref={mapRef}
                mapboxToken={mapboxToken}
                zones={sortedZones}
                selectedZoneId={selectedZoneId}
                onPolygonCreated={handlePolygonCreated}
                onPolygonUpdated={handlePolygonUpdated}
                onZoneClick={handleZoneClickOnMap}
              />
            </div>
          )}

          <DeliveryZoneTable
            zones={sortedZones}
            onEdit={handleEditZone}
            onDelete={(zone) => setZoneToDelete(zone)}
            t={t}
            selectedZoneId={selectedZoneId}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? t("newZone") : t("editZone")}</DialogTitle>
          </DialogHeader>
          <DeliveryZoneForm
            mode={dialogMode}
            initialValues={activeZone ?? undefined}
            geometry={pendingGeometry}
            loading={saving}
            onSubmit={(formValues) => handleFormSubmit({ ...formValues, geometry: formValues.geometry! })}
            onCancel={() => handleDialogClose(false)}
            t={t}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(zoneToDelete)} onOpenChange={(open) => !open && setZoneToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

async function safeParseError(response: Response) {
  try {
    const data = await response.json()
    return data?.error as string | undefined
  } catch (error) {
    return undefined
  }
}

function readTokenFromCookies(cookieName = "adminToken") {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${cookieName}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}
