"use client"

import type { DeliveryZone } from "@/types/delivery-zones"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ZoneLegendProps {
  zones: DeliveryZone[]
  selectedZone?: DeliveryZone | null
  onZoneSelect?: (zone: DeliveryZone) => void
  onZoneToggle?: (zone: DeliveryZone) => void
  className?: string
}

export default function ZoneLegend({
  zones,
  selectedZone,
  onZoneSelect,
  onZoneToggle,
  className = "",
}: ZoneLegendProps) {
  const activeZones = zones.filter((zone) => zone.is_active)
  const inactiveZones = zones.filter((zone) => !zone.is_active)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Delivery Zones</CardTitle>
        <p className="text-sm text-muted-foreground">
          {activeZones.length} active zone{activeZones.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active Zones */}
        {activeZones.map((zone) => (
          <div
            key={zone.id}
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedZone?.id === zone.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
            }`}
            onClick={() => onZoneSelect?.(zone)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                style={{ backgroundColor: zone.color, borderColor: zone.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{zone.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    €{zone.delivery_fee}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {zone.zone_type}
                  </Badge>
                </div>
              </div>
            </div>
            {onZoneToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onZoneToggle(zone)
                }}
                className="ml-2 h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {/* Inactive Zones */}
        {inactiveZones.length > 0 && (
          <>
            <div className="border-t pt-3 mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Inactive Zones ({inactiveZones.length})</p>
            </div>
            {inactiveZones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-3 rounded-lg border opacity-60 cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => onZoneSelect?.(zone)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                    style={{ backgroundColor: zone.color, borderColor: zone.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{zone.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        €{zone.delivery_fee}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {zone.zone_type}
                      </Badge>
                    </div>
                  </div>
                </div>
                {onZoneToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onZoneToggle(zone)
                    }}
                    className="ml-2 h-8 w-8 p-0"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </>
        )}

        {zones.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No delivery zones created yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
