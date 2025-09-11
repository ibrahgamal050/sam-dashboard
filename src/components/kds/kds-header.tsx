"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface KdsHeaderProps {
  showAllDine: boolean
  showRecentlyFulfilled: boolean
  readyCount: number
  onToggleAllDine: () => void
  onToggleRecentlyFulfilled: () => void
}

export function KdsHeader({
  showAllDine,
  showRecentlyFulfilled,
  readyCount,
  onToggleAllDine,
  onToggleRecentlyFulfilled,
}: KdsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
      <h1 className="text-2xl font-bold">Expediter</h1>

      <div className="flex items-center gap-3">
        <Button variant={showAllDine ? "default" : "outline"} size="sm" onClick={onToggleAllDine}>
          Show All Dine View
        </Button>

        <Button variant={showRecentlyFulfilled ? "default" : "outline"} size="sm" onClick={onToggleRecentlyFulfilled}>
          Show Recently Fulfilled
        </Button>

        <Button variant="outline" size="sm">
          Recall
        </Button>

        <div className="flex flex-col items-center">
          <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
            {readyCount}
          </Badge>
          <span className="text-xs text-muted-foreground">Ready</span>
        </div>
      </div>
    </div>
  )
}
