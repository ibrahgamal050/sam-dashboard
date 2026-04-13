"use client"

import { useEffect, useRef, useState } from "react"
import type { DeliveryZone } from "@/types/delivery-zones"

interface DeliveryZonesMapProps {
  zones: DeliveryZone[]
  selectedZone: DeliveryZone | null
  onZoneSelect: (zone: DeliveryZone | null) => void
  onZoneUpdate: (zone: DeliveryZone) => void
  isEditing: boolean
}

export function DeliveryZonesMap({
  zones,
  selectedZone,
  onZoneSelect,
  onZoneUpdate,
  isEditing,
}: DeliveryZonesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Mock map implementation - in a real app, you'd use Google Maps, Mapbox, etc.
  useEffect(() => {
    if (mapRef.current && !mapLoaded) {
      // Simulate map loading
      setTimeout(() => setMapLoaded(true), 1000)
    }
  }, [mapLoaded])

  const handleZoneClick = (zone: DeliveryZone) => {
    onZoneSelect(zone)
  }

  return (
    <div className="flex-1 relative bg-muted">
      <div ref={mapRef} className="w-full h-full relative overflow-hidden">
        {!mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل الخريطة...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mock Map Background */}
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('/amsterdam-city-map-streets-canals.jpg')`,
              }}
            >
              {/* Map Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="bg-card border border-border rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-lg font-mono">+</span>
                </button>
                <button className="bg-card border border-border rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-lg font-mono">−</span>
                </button>
              </div>

              {/* Zone Overlays */}
              <div className="absolute inset-0">
                {zones
                  .filter((zone) => zone.is_active)
                  .map((zone, index) => (
                    <div
                      key={zone.id}
                      className={`absolute cursor-pointer transition-all duration-200 ${
                        selectedZone?.id === zone.id ? "ring-4 ring-white/50" : ""
                      }`}
                      style={{
                        left: `${20 + index * 15}%`,
                        top: `${30 + index * 10}%`,
                        width: zone.zone_type === "circle" ? "120px" : "140px",
                        height: zone.zone_type === "circle" ? "120px" : "100px",
                        backgroundColor: `${zone.color}40`,
                        border: `2px solid ${zone.color}`,
                        borderRadius: zone.zone_type === "circle" ? "50%" : "8px",
                      }}
                      onClick={() => handleZoneClick(zone)}
                    >
                      {/* Zone Label */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-card border border-border rounded-lg px-2 py-1 shadow-sm text-xs font-medium whitespace-nowrap">
                          {zone.name}
                        </div>
                      </div>

                      {/* Zone Center Marker */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: zone.color }}
                      />
                    </div>
                  ))}
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-4 shadow-sm max-w-xs">
                <h4 className="font-medium text-sm mb-3 text-card-foreground">المناطق النشطة</h4>
                <div className="space-y-2">
                  {zones
                    .filter((zone) => zone.is_active)
                    .map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                          <span className="text-card-foreground">{zone.name}</span>
                        </div>
                        <span className="text-muted-foreground">{zone.delivery_fee.toFixed(2)} ج</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Attribution */}
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded">
                بيانات الخريطة © OpenStreetMap contributors
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
