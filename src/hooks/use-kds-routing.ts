"use client"

import { useCallback, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import type { Station } from "@/types/order"

export interface KdsRouteState {
  station: Station | "all"
  showAllDine: boolean
  showRecentlyFulfilled: boolean
  includeReady: boolean
  orderId?: string
  view?: "grid" | "list"
}

export function useKdsRouting() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse current URL state
  const currentState: KdsRouteState = {
    station: (searchParams.get("station") as Station) || "expo",
    showAllDine: searchParams.get("view") === "all-dine",
    showRecentlyFulfilled: searchParams.get("fulfilled") === "1",
    includeReady: searchParams.get("includeReady") !== "0",
    orderId: searchParams.get("orderId") || undefined,
    view: (searchParams.get("display") as "grid" | "list") || "grid",
  }

  const updateRoute = useCallback(
    (updates: Partial<KdsRouteState>, options?: { replace?: boolean; scroll?: boolean }) => {
      try {
        const params = new URLSearchParams(searchParams.toString())

        // Handle station changes
        if (updates.station !== undefined) {
          if (updates.station === "expo" || updates.station === "all") {
            params.delete("station")
          } else {
            params.set("station", updates.station)
          }
        }

        // Handle view mode changes
        if (updates.showAllDine !== undefined) {
          if (updates.showAllDine) {
            params.set("view", "all-dine")
            params.delete("station") // Clear station when showing all dine
          } else {
            params.delete("view")
          }
        }

        // Handle fulfilled orders view
        if (updates.showRecentlyFulfilled !== undefined) {
          if (updates.showRecentlyFulfilled) {
            params.set("fulfilled", "1")
          } else {
            params.delete("fulfilled")
          }
        }

        // Handle ready orders inclusion
        if (updates.includeReady !== undefined) {
          if (updates.includeReady) {
            params.delete("includeReady") // Default is true
          } else {
            params.set("includeReady", "0")
          }
        }

        // Handle order selection
        if (updates.orderId !== undefined) {
          if (updates.orderId) {
            params.set("orderId", updates.orderId)
          } else {
            params.delete("orderId")
          }
        }

        // Handle display mode
        if (updates.view !== undefined) {
          if (updates.view === "grid") {
            params.delete("display") // Default is grid
          } else {
            params.set("display", updates.view)
          }
        }

        const newUrl = `${pathname}?${params.toString()}`

        const navigationOptions = { scroll: options?.scroll ?? false }

        if (options?.replace) {
          router.replace(newUrl, navigationOptions)
        } else {
          router.push(newUrl, navigationOptions)
        }

        console.log("[v0] Route updated:", { updates, newUrl })
      } catch (error) {
        console.error("[v0] Routing error:", error)
        // Fallback: navigate to base path on error
        router.push(pathname, { scroll: false })
      }
    },
    [searchParams, router, pathname],
  )

  const navigateToStation = useCallback(
    (station: Station | "all") => {
      updateRoute({
        station: station === "all" ? "all" : station,
        showAllDine: station === "all",
        showRecentlyFulfilled: false, // Reset fulfilled view when changing stations
      })
    },
    [updateRoute],
  )

  const navigateToOrder = useCallback(
    (orderId: string) => {
      updateRoute({ orderId }, { scroll: true })
    },
    [updateRoute],
  )

  const clearOrderSelection = useCallback(() => {
    updateRoute({ orderId: undefined })
  }, [updateRoute])

  const toggleView = useCallback(
    (view: "all-dine" | "fulfilled" | "ready") => {
      switch (view) {
        case "all-dine":
          updateRoute({
            showAllDine: !currentState.showAllDine,
            station: !currentState.showAllDine ? "all" : "expo",
          })
          break
        case "fulfilled":
          updateRoute({
            showRecentlyFulfilled: !currentState.showRecentlyFulfilled,
          })
          break
        case "ready":
          updateRoute({
            includeReady: !currentState.includeReady,
          })
          break
      }
    },
    [updateRoute],
  )

  useEffect(() => {
    const handlePopState = () => {
      console.log("[v0] Browser navigation detected, syncing state")
      // State will be automatically updated by searchParams change
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    const station = searchParams.get("station") as Station
    const validStations: (Station | "all")[] = ["wings", "burger", "fries", "potatoes", "drinks", "expo", "all"]

    // Validate and correct invalid station parameters
    if (station && !validStations.includes(station)) {
      console.log("[v0] Invalid station parameter, correcting to expo")
      updateRoute({ station: "expo" }, { replace: true })
    }
  }, [searchParams, updateRoute])

  return {
    currentState,
    updateRoute,
    navigateToStation,
    navigateToOrder,
    clearOrderSelection,
    toggleView,
  }
}
