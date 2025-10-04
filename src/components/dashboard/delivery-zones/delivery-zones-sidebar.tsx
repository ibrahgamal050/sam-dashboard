"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit3, Trash2, Circle, BoldIcon as Polygon, ChevronDown, Euro, Eye, EyeOff } from "lucide-react"
import type { DeliveryZone } from "@/types/delivery-zones"
import { cn } from "@/lib/utils"

interface DeliveryZonesSidebarProps {
  zones: DeliveryZone[]
  selectedZone: DeliveryZone | null
  onZoneSelect: (zone: DeliveryZone | null) => void
  onZoneUpdate: (zone: DeliveryZone) => void
  onZoneCreate: (zone: Omit<DeliveryZone, "id" | "created_at" | "updated_at" | "created_by"> & {
    coordinates?: Array<{ lat: number; lng: number }>
    radius?: number
    isActive?: boolean
    shape?: "circle" | "custom"
  }) => void
  onZoneDelete: (zoneId: string) => void
  isEditing: boolean
  onEditingChange: (editing: boolean) => void
}

const ZONE_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5A2B", "#6B7280"]

export function DeliveryZonesSidebar({
  zones,
  selectedZone,
  onZoneSelect,
  onZoneUpdate,
  onZoneCreate,
  onZoneDelete,
  isEditing,
  onEditingChange,
}: DeliveryZonesSidebarProps) {
  const [editForm, setEditForm] = useState({
    name: "",
    deliveryFee: 0,
    color: ZONE_COLORS[0],
    shape: "circle" as "circle" | "custom",
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleEditZone = (zone: DeliveryZone) => {
    setEditForm({
      name: zone.name,
      deliveryFee: zone.delivery_fee,
      color: zone.color,
      shape: zone.zone_type === "circle" ? "circle" : "custom",
    })
    onZoneSelect(zone)
    onEditingChange(true)
  }

  const handleSaveZone = () => {
    if (selectedZone) {
      onZoneUpdate({
        ...selectedZone,
        name: editForm.name,
        color: editForm.color,
        delivery_fee: editForm.deliveryFee,
        zone_type: editForm.shape === "circle" ? "circle" : "polygon",
      })
    } else {
      const fallbackZone = zones.length > 0 ? zones[0] : undefined
      const mockRestaurantId = fallbackZone?.restaurantId ?? ""

      onZoneCreate({
        restaurantId: mockRestaurantId,
        name: editForm.name,
        delivery_fee: editForm.deliveryFee,
        color: editForm.color,
        zone_type: editForm.shape === "circle" ? "circle" : "polygon",
        is_active: true,
        geometry:
          editForm.shape === "circle"
            ? {
                type: "Point",
                coordinates: [52.3676, 4.9041],
                properties: { radius: 2000 },
              }
            : {
                type: "Polygon",
                coordinates: [
                  [
                    [4.9041, 52.3676],
                    [4.9141, 52.3676],
                    [4.9141, 52.3776],
                    [4.9041, 52.3776],
                    [4.9041, 52.3676],
                  ],
                ],
              },
      })
    }
    onEditingChange(false)
    onZoneSelect(null)
  }

  const handleCreateNew = () => {
    setEditForm({
      name: "",
      deliveryFee: 0,
      color: ZONE_COLORS[0],
      shape: "circle",
    })
    onZoneSelect(null)
    onEditingChange(true)
  }

  const toggleZoneVisibility = (zone: DeliveryZone) => {
    onZoneUpdate({
      ...zone,
      is_active: !zone.is_active,
    })
  }

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col">
      {/* Zone List */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-card-foreground">Active Zones</h2>
            <Button size="sm" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {zones.map((zone) => (
              <Card
                key={zone.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedZone?.id === zone.id && "ring-2 ring-primary",
                )}
                onClick={() => onZoneSelect(zone)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                      <span className="font-medium text-sm">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleZoneVisibility(zone)
                        }}
                      >
                        {zone.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditZone(zone)
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onZoneDelete(zone.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {zone.zone_type === "circle" ? <Circle className="h-3 w-3" /> : <Polygon className="h-3 w-3" />}
                      <span className="capitalize">{zone.zone_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="h-3 w-3" />
                      <span>{zone.delivery_fee.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Edit Panel */}
      {isEditing && (
        <div className="border-t border-border bg-muted/30">
          <div className="p-4">
            <h3 className="font-semibold mb-4 text-card-foreground">{selectedZone ? "Edit Zone" : "Create Zone"}</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="zone-name" className="text-sm font-medium">
                  Zone name *
                </Label>
                <Input
                  id="zone-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter zone name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Shape</Label>
                <div className="flex gap-2">
                  <Button
                    variant={editForm.shape === "circle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditForm({ ...editForm, shape: "circle" })}
                    className="flex-1"
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Circle
                  </Button>
                  <Button
                    variant={editForm.shape === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditForm({ ...editForm, shape: "custom" })}
                    className="flex-1"
                  >
                    <Polygon className="h-4 w-4 mr-2" />
                    Custom
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="delivery-fee" className="text-sm font-medium">
                  Delivery fee *
                </Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="delivery-fee"
                    type="number"
                    step="0.01"
                    value={editForm.deliveryFee}
                    onChange={(e) => setEditForm({ ...editForm, deliveryFee: Number.parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {ZONE_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-lg border-2 transition-all",
                        editForm.color === color ? "border-primary scale-110" : "border-border hover:scale-105",
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditForm({ ...editForm, color })}
                    />
                  ))}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
              >
                Advanced settings
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
              </Button>

              {showAdvanced && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Additional zone configuration options will appear here.
                  </div>
                </div>
              )}

              <Button onClick={handleSaveZone} className="w-full">
                {selectedZone ? "Update Zone" : "Create Zone"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
