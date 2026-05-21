"use client"

import { useMemo, useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { IMenuItem } from "@/types/menu"
import type { MenuType } from "@/lib/menu-types"

interface EditItemModalProps {
  item: IMenuItem
  currency: {
    en?: string
    ar?: string
  }
  restaurantslug: string
  restaurantId?: string
  initialMenuType?: MenuType
  onSave: (item: IMenuItem) => void
  onCancel: () => void
  onDelete: () => void
}

type MenuTypeOverrideState = {
  price: string
  isHidden: boolean
  isAvailable: boolean
}

type MenuTypeSettingsProps = {
  value: MenuTypeOverrideState
  basePrice: number | null
  currencyLabel: string
  onChange: (next: MenuTypeOverrideState) => void
}

type SizeDraft = {
  id: string
  name: { ar: string; en: string }
  price: string
}

const MENU_TYPE_LABELS: Record<MenuType, string> = {
  delivery: "Доставка",
  dinein: "Зал",
  takeaway: "Самовывоз",
}

const createOverrideState = (itemData?: any): MenuTypeOverrideState => ({
  price: typeof itemData?.price === "number" ? String(itemData.price) : "",
  isHidden: Boolean(itemData?.isHidden),
  isAvailable: typeof itemData?.isAvailable === "boolean" ? itemData.isAvailable : true,
})

const normalizeNumber = (value: string): number | null => {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const createSizeDraft = (size?: any, index?: number): SizeDraft => ({
  id: size?._id?.toString?.() || `${Date.now()}-${index ?? 0}`,
  name: {
    ar: size?.name?.ar || "",
    en: size?.name?.en || "",
  },
  price: typeof size?.price === "number" ? String(size.price) : "",
})

function MenuTypeSettings({ value, basePrice, currencyLabel, onChange }: MenuTypeSettingsProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Показывать в этом меню</p>
          <p className="text-xs text-slate-500">Если выключить, позиция будет скрыта только для этого типа меню.</p>
        </div>
        <Switch
          checked={!value.isHidden}
          onCheckedChange={(checked) => onChange({ ...value, isHidden: !checked })}
        />
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">Базовая цена</p>
            <p className="text-lg font-semibold text-slate-900">
              {typeof basePrice === "number" ? basePrice.toFixed(0) : "--"} {currencyLabel}
            </p>
          </div>
          <div className="text-xs text-slate-500">Оставьте поле пустым, чтобы использовать базовую цену.</div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={value.price}
            onChange={(event) => onChange({ ...value, price: event.target.value })}
            placeholder="Индивидуальная цена"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Доступно</p>
            <p className="text-xs text-slate-500">Управляет доступностью позиции для этого типа меню.</p>
          </div>
          <Switch
            checked={value.isAvailable}
            onCheckedChange={(checked) => onChange({ ...value, isAvailable: checked })}
          />
        </div>
      </div>
    </div>
  )
}

export function EditItemModal({
  item,
  currency,
  restaurantslug,
  restaurantId,
  initialMenuType = "delivery",
  onSave,
  onCancel,
  onDelete,
}: EditItemModalProps) {
  const [activeMenuType, setActiveMenuType] = useState<MenuType>(initialMenuType)
  const [baseName, setBaseName] = useState({
    ar: item.name?.ar || "",
    en: item.name?.en || "",
  })
  const [sizeDrafts, setSizeDrafts] = useState<SizeDraft[]>(
    Array.isArray(item.sizes) ? item.sizes.map((size, index) => createSizeDraft(size, index)) : [],
  )
  const [hasSizes, setHasSizes] = useState(
    Array.isArray(item.sizes) && item.sizes.length > 0,
  )
  const [overrides, setOverrides] = useState<Record<MenuType, MenuTypeOverrideState>>({
    delivery: createOverrideState(item),
    dinein: createOverrideState(),
    takeaway: createOverrideState(),
  })
  const [loadedTypes, setLoadedTypes] = useState<Set<MenuType>>(new Set([initialMenuType]))
  const [loadingType, setLoadingType] = useState<MenuType | null>(null)
  const [basePrice, setBasePrice] = useState<number | null>(
    typeof item.price === "number" ? item.price : null,
  )
  const [globalHidden, setGlobalHidden] = useState(false)
  const [resetMenuTypes, setResetMenuTypes] = useState<MenuType[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)

  const currencyLabel = currency.ar || currency.en || "EGP"

  const activeOverride = overrides[activeMenuType]

  const itemTitle = useMemo(
    () => baseName.ar || baseName.en || "Позиция",
    [baseName.ar, baseName.en],
  )

  const itemDescription = useMemo(
    () => item.description?.ar || item.description?.en || "",
    [item.description?.ar, item.description?.en],
  )

  const handleOverrideChange = (menuType: MenuType, nextValue: MenuTypeOverrideState) => {
    setOverrides((prev) => ({ ...prev, [menuType]: nextValue }))
  }

  const handleSizeNameChange = (id: string, lang: "ar" | "en", value: string) => {
    setSizeDrafts((prev) =>
      prev.map((size) =>
        size.id === id ? { ...size, name: { ...size.name, [lang]: value } } : size,
      ),
    )
  }

  const handleSizePriceChange = (id: string, value: string) => {
    setSizeDrafts((prev) =>
      prev.map((size) => (size.id === id ? { ...size, price: value } : size)),
    )
  }

  const addSize = () => {
    setSizeDrafts((prev) => [...prev, createSizeDraft()])
    setHasSizes(true)
  }

  const removeSize = (id: string) => {
    setSizeDrafts((prev) => prev.filter((size) => size.id !== id))
  }

  useEffect(() => {
    if (!restaurantId || typeof basePrice === "number") return
    const loadBase = async () => {
      try {
        const response = await fetch(
          `/api/admin/restaurants/${restaurantId}/menu-items?menuType=${activeMenuType}`,
          { cache: "no-store" },
        )
        if (!response.ok) return
        const data = await response.json()
        const found = data?.items?.find((menuItem: any) => String(menuItem.id) === String(item._id))
        if (found && typeof found.defaultPrice === "number") {
          setBasePrice(found.defaultPrice)
        }
      } catch {
        // Ignore
      }
    }
    void loadBase()
  }, [restaurantId, basePrice, activeMenuType, item._id])

  const loadMenuTypeData = async (menuType: MenuType) => {
    if (loadedTypes.has(menuType)) return
    setLoadingType(menuType)
    try {
      const response = await fetch(
        `/api/dashboard/restaurants/${encodeURIComponent(restaurantslug)}/menu?menuType=${menuType}`,
        { cache: "no-store" },
      )
      if (!response.ok) {
        throw new Error(`Не удалось загрузить ${MENU_TYPE_LABELS[menuType]}`)
      }
      const data = await response.json()
      const found = data?.categories
        ?.flatMap((category: any) => category.menuItems || [])
        ?.find((menuItem: any) => String(menuItem._id) === String(item._id))
      if (found) {
        setOverrides((prev) => ({
          ...prev,
          [menuType]: createOverrideState(found),
        }))
      }
      setLoadedTypes((prev) => new Set([...prev, menuType]))
    } catch {
      // Ignore for now; keep existing values
    } finally {
      setLoadingType(null)
    }
  }

  const handleMenuTypeTab = (menuType: MenuType) => {
    setActiveMenuType(menuType)
    if (!loadedTypes.has(menuType)) {
      void loadMenuTypeData(menuType)
    }
  }

  const handleResetMenuType = () => {
    setOverrides((prev) => ({
      ...prev,
      [activeMenuType]: createOverrideState(),
    }))
    setResetMenuTypes((prev) =>
      prev.includes(activeMenuType) ? prev : [...prev, activeMenuType],
    )
  }

  const buildOverridesPayload = () => {
    const result: Record<MenuType, any> = {} as Record<MenuType, any>
    Object.entries(overrides).forEach(([type, value]) => {
      const priceValue = normalizeNumber(value.price)
      result[type as MenuType] = {
        price: priceValue,
        isHidden: value.isHidden,
        isAvailable: value.isAvailable,
      }
    })
    return result
  }

  const buildBasePayload = () => {
    const sizesPayload = hasSizes
      ? sizeDrafts
          .filter((size) => size.name.ar.trim() || size.name.en.trim())
          .map((size) => ({
            label: size.name.ar.trim() || size.name.en.trim(),
            price: normalizeNumber(size.price) ?? undefined,
          }))
      : []

    return {
      name: {
        ar: baseName.ar.trim(),
        en: baseName.en.trim(),
      },
      sizes: sizesPayload,
    }
  }

  const handleSave = async () => {
    if (!item._id) return
    setSaving(true)
    try {
      const response = await fetch(
        `/api/dashboard/restaurants/${encodeURIComponent(restaurantslug)}/menu?menuType=${activeMenuType}`,
        {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: String(item._id),
          overrides: buildOverridesPayload(),
          globalHidden,
          resetMenuTypes,
          base: buildBasePayload(),
        }),
      },
    )

      if (!response.ok) {
        const status = response.status
        if (status === 401 || status === 403) {
          toast.error("Нет доступа", {
            description: "У вас нет прав на редактирование этой позиции.",
          })
        } else {
          toast.error("Не удалось сохранить изменения", {
            description: "Попробуйте еще раз.",
          })
        }
        return
      }

      const nextPrice = normalizeNumber(activeOverride.price)
      const effectivePrice = typeof nextPrice === "number" ? nextPrice : basePrice ?? item.price ?? 0
      const updatedItem = {
        ...item,
        price: effectivePrice,
        isAvailable: activeOverride.isAvailable,
        isHidden: activeOverride.isHidden,
      }
      onSave(updatedItem)
    } catch {
      toast.error("Не удалось сохранить изменения", {
        description: "Попробуйте еще раз.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <SheetContent
        side="left"
        dir="ltr"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden border-r border-slate-200 bg-white p-0 text-left shadow-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Редактирование позиции</SheetTitle>
        </SheetHeader>
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold text-slate-400">Настройки позиции</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{itemTitle}</h2>
          {itemDescription ? (
            <p className="mt-2 text-sm text-slate-500">{itemDescription}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {(Object.keys(MENU_TYPE_LABELS) as MenuType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleMenuTypeTab(type)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  activeMenuType === type
                    ? "bg-white text-[#2e6fe6] shadow"
                    : "text-slate-600 hover:bg-white/70",
                )}
              >
                {MENU_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          {loadingType === activeMenuType ? (
            <span className="text-xs text-slate-500">Загрузка...</span>
          ) : null}
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400">Основные данные</p>
              <p className="text-sm text-slate-500">Измените название позиции и базовые размеры.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Название на арабском</label>
                <input
                  value={baseName.ar}
                  onChange={(event) => setBaseName({ ...baseName, ar: event.target.value })}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="Например: гриль-ассорти"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Название на английском</label>
                <input
                  value={baseName.en}
                  onChange={(event) => setBaseName({ ...baseName, en: event.target.value })}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="Example: Mixed Grill"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Размеры</p>
                  <p className="text-xs text-slate-500">Добавьте дополнительные размеры и цены.</p>
                </div>
                <Switch checked={hasSizes} onCheckedChange={setHasSizes} />
              </div>

              {hasSizes ? (
                <div className="space-y-3">
                  {sizeDrafts.length === 0 ? (
                    <p className="text-xs text-slate-500">Размеры пока не добавлены.</p>
                  ) : (
                    sizeDrafts.map((size) => (
                      <div
                        key={size.id}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1.5fr_1.5fr_120px_auto]"
                      >
                        <input
                          value={size.name.ar}
                          onChange={(event) => handleSizeNameChange(size.id, "ar", event.target.value)}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                          placeholder="Название размера на арабском"
                        />
                        <input
                          value={size.name.en}
                          onChange={(event) => handleSizeNameChange(size.id, "en", event.target.value)}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                          placeholder="Название размера на английском"
                          dir="ltr"
                        />
                        <input
                          type="number"
                          value={size.price}
                          onChange={(event) => handleSizePriceChange(size.id, event.target.value)}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                          placeholder="Цена"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => removeSize(size.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    ))
                  )}
                  <Button type="button" variant="outline" className="rounded-xl" onClick={addSize}>
                    + Добавить размер
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Для этой позиции размеры отображаться не будут.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Следующие настройки применяются только к выбранному типу меню.
          </div>

          <MenuTypeSettings
            value={activeOverride}
            basePrice={basePrice}
            currencyLabel={currencyLabel}
            onChange={(next) => handleOverrideChange(activeMenuType, next)}
          />

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Расширенные настройки
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showAdvanced && (
              <div className="space-y-4 px-4 py-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Скрыть позицию во всем ресторане</p>
                    <p className="text-xs text-slate-500">Позиция будет скрыта во всех типах меню.</p>
                  </div>
                  <Switch checked={globalHidden} onCheckedChange={setGlobalHidden} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 opacity-60">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Временное отключение</p>
                    <p className="text-xs text-slate-500">Скоро</p>
                  </div>
                  <Switch checked={false} disabled />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-slate-200"
                  onClick={handleResetMenuType}
                >
                  Сбросить этот тип меню
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={onDelete}>
            Удалить позицию
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onCancel}>
              Отмена
            </Button>
            <Button onClick={handleSave} className="bg-[#2e6fe6] hover:bg-[#2357b9]" disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
