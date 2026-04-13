"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type LocalizedText = {
  ar?: string
  en?: string
}

type MenuItemRow = {
  id: string
  name: LocalizedText
  description?: LocalizedText
  image?: string
  category?: string
  defaultPrice?: number | null
  price: number | null
  isAvailable: boolean
  isHidden: boolean
  sortOrder: number | null
  hasOverride: boolean
}

type MenuResponse = {
  items: MenuItemRow[]
}

type BranchMenuAdminProps = {
  restaurantId: string
  restaurantName?: string
  brandName?: string
}

const parseNumber = (value: string) => {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const isValidNumber = (value: number | null): value is number =>
  typeof value === "number" && !Number.isNaN(value)

const formatMoney = (value: number | null) => {
  if (!isValidNumber(value)) return "-"
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
}

export default function BranchMenuAdmin({ restaurantId, restaurantName, brandName }: BranchMenuAdminProps) {
  const [items, setItems] = useState<MenuItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "available" | "hidden">("all")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setActionError(null)
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/menu-items`, {
        cache: "no-store",
      })
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to load menu items")
      }
      const data = (await res.json()) as MenuResponse
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load menu items"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const updateItem = useCallback((id: string, patch: Partial<MenuItemRow>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      const name = `${item.name?.ar || ""} ${item.name?.en || ""}`.toLowerCase()
      const matchesQuery = !normalized || name.includes(normalized)
      if (!matchesQuery) return false
      if (filter === "available") return item.isAvailable
      if (filter === "hidden") return item.isHidden
      return true
    })
  }, [items, query, filter])

  const saveItem = async (item: MenuItemRow) => {
    if (!isValidNumber(item.price) || item.price < 0) {
      setActionError("Price is required before saving.")
      return
    }
    setActionError(null)
    setSavingId(item.id)
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/menu-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandItemId: item.id,
          price: item.price,
          isAvailable: item.isAvailable,
          isHidden: item.isHidden,
          sortOrder: item.sortOrder,
        }),
      })
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to save item")
      }
      updateItem(item.id, { hasOverride: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save item"
      setActionError(message)
    } finally {
      setSavingId(null)
    }
  }

  const importFromBrand = async () => {
    setActionError(null)
    setImporting(true)
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/menu-items`, {
        method: "POST",
      })
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to import")
      }
      await fetchItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import"
      setActionError(message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Branch menu</h2>
            <p className="text-xs text-gray-500">
              {restaurantName ? `${restaurantName} \u00b7 ` : ""}
              {brandName || "Brand"} catalog overrides
            </p>
          </div>
          <button
            type="button"
            onClick={importFromBrand}
            disabled={importing || loading}
            className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
          >
            {importing ? "Importing..." : "Import from Brand"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name"
            className="min-w-[220px] flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "available", "hidden"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  filter === value
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-gray-700"
                }`}
              >
                {value === "all" ? "All" : value === "available" ? "Available" : "Hidden"}
              </button>
            ))}
          </div>
        </div>
        {actionError ? <p className="mt-3 text-xs text-red-600">{actionError}</p> : null}
      </section>

      <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-40 rounded-full bg-gray-200" />
                  <div className="h-4 w-16 rounded-full bg-gray-200" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="h-10 rounded-xl bg-gray-200" />
                  <div className="h-10 rounded-xl bg-gray-200" />
                  <div className="h-10 rounded-xl bg-gray-200" />
                  <div className="h-10 rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">Failed to load menu items</p>
            <p className="mt-1 text-xs text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchItems}
              className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-sm font-semibold text-gray-900">No menu items yet</p>
            <p className="text-xs text-gray-500">Import items from the brand catalog to get started.</p>
            <button
              type="button"
              onClick={importFromBrand}
              disabled={importing}
              className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white"
            >
              {importing ? "Importing..." : "Import from Brand"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const priceInvalid = !isValidNumber(item.price) || (item.price ?? 0) < 0
              return (
                <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-white">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name?.en || item.name?.ar || "menu item"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.name?.ar || item.name?.en || "Unnamed item"}
                        </p>
                        <p className="text-xs text-gray-500">{item.category || "Uncategorized"}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.hasOverride ? "Override" : "Brand default"} · {formatMoney(item.price)}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <input
                      type="number"
                      min={0}
                      value={item.price ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, { price: parseNumber(event.target.value) })
                      }
                      placeholder="Price"
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={item.isAvailable}
                        onChange={(event) => updateItem(item.id, { isAvailable: event.target.checked })}
                      />
                      Available
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={item.isHidden}
                        onChange={(event) => updateItem(item.id, { isHidden: event.target.checked })}
                      />
                      Hidden
                    </label>
                    <input
                      type="number"
                      value={item.sortOrder ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, { sortOrder: parseNumber(event.target.value) })
                      }
                      placeholder="Sort order"
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => saveItem(item)}
                      disabled={savingId === item.id || priceInvalid}
                      className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {savingId === item.id ? "Saving..." : "Save"}
                    </button>
                    <span className="text-xs text-gray-500">
                      Brand price: {formatMoney(item.defaultPrice ?? null)}
                    </span>
                    {priceInvalid ? (
                      <span className="text-xs text-red-600">Price required</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
