"use client"

import type React from "react"

import type { Station } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StationTabsProps {
  stations: { name: Station; label: string; count: number }[]
  activeStation: Station | "all"
  onStationChange: (station: Station | "all") => void
  totalCount: number
}

export function StationTabs({ stations, activeStation, onStationChange, totalCount }: StationTabsProps) {
  const handleKeyDown = (e: React.KeyboardEvent, station: Station) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onStationChange(station)
    }
  }

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-muted/30 border-b">
      <div className="flex gap-2" role="tablist" aria-label="Kitchen stations">
        {stations.map((station) => (
          <button
            key={station.name}
            onClick={() => onStationChange(station.name)}
            onKeyDown={(e) => handleKeyDown(e, station.name)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              "focus:outline-hidden focus:ring-2 focus:ring-primary/20",
              activeStation === station.name ? "bg-primary text-primary-foreground" : "hover:bg-muted focus:bg-muted",
            )}
            role="tab"
            aria-selected={activeStation === station.name}
            aria-controls={`station-panel-${station.name}`}
          >
            {station.label}
            <Badge variant="secondary" className="text-xs">
              {station.count}
            </Badge>
          </button>
        ))}
      </div>

      <div className="flex-1 flex justify-center">
        <div className="bg-primary/10 px-4 py-1.5 rounded-full text-sm font-medium">
          {activeStation === "all" ? "All Stations" : stations.find((s) => s.name === activeStation)?.label}
          <span className="ml-2 text-muted-foreground">({totalCount} tickets)</span>
        </div>
      </div>
    </div>
  )
}
