"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  Edit,
  GripVertical,
  MoreHorizontal,
  Plus,
  X,
  ImageIcon,
  Save,
  AlertCircle,
} from "lucide-react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { Types } from "mongoose"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { EditItemModal } from "./edit-item-modal"
import { EditSectionModal } from "./edit-section-modal"
import { MenuImageManager } from "./menu-image-manager"
import { MenuPreview } from "./menu-preview"
import { MenuTypeSwitcher } from "./menu-type-switcher"
import { cn } from "@/lib/utils"
import type { IMenu, ICategory, IMenuItem, IMenuImage } from "@/types/menu"
import { MenuLoadingState } from "./menu-loading-state"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MenuService } from "@/lib/menu-service"
import { type MenuType, normalizeMenuType } from "@/lib/menu-types"

type MenuEditorProps = {
  menuId: string
  restaurantslug: string
  initialMenu?: IMenu
  restaurantId?: string
}

export function MenuEditor({ menuId, restaurantslug, initialMenu, restaurantId }: MenuEditorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [menu, setMenu] = useState<IMenu | null>(initialMenu || null)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [menuImages, setMenuImages] = useState<IMenuImage[]>([])
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor")
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null)
  const [editingItemSectionId, setEditingItemSectionId] = useState<Types.ObjectId | string | null>(null)
  const [editingSection, setEditingSection] = useState<ICategory | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState<"ar" | "en">("ar")
  const [imageManagerOpen, setImageManagerOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [showStoppedItems, setShowStoppedItems] = useState(false)
  const [loading, setLoading] = useState(!initialMenu)
  const [saving, setSaving] = useState(false)
  const [orderSaving, setOrderSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const orderSaveTimerRef = useRef<number | null>(null)

  const rawMenuType = searchParams.get("menuType")
  const resolvedMenuType = normalizeMenuType(rawMenuType)
  const menuType = resolvedMenuType ?? "delivery"

  useEffect(() => {
    if (restaurantId) {
      MenuService.setRestaurantId(restaurantId)
    }
  }, [restaurantId])

  useEffect(() => {
    if (!rawMenuType || !resolvedMenuType) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("menuType", "delivery")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [rawMenuType, resolvedMenuType, pathname, router, searchParams])

  const fetchMenu = useCallback(
    async (activeMenuType: MenuType, showHidden: boolean) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        setLoading(true)
        setError(null)

        const menuData = await MenuService.getMenu(restaurantslug, activeMenuType, {
          signal: controller.signal,
          showHidden,
        })

        setMenu(menuData)
        setCategories(menuData.categories || [])
        setMenuImages(menuData.menuImages || [])
      } catch (error: any) {
        if (error?.name === "AbortError") return
        console.error("Failed to load menu:", error)
        const status = typeof error?.status === "number" ? error.status : null
        if (status === 401 || status === 403) {
          setError("ليست لديك صلاحية لعرض هذا المنيو.")
          toast.error("غير مصرح", {
            description: "يرجى التأكد من الصلاحيات ثم المحاولة مرة أخرى.",
          })
        } else {
          setError(`Failed to load menu: ${error.message || "Unknown error"}`)
          toast.error("Failed to load menu", {
            description: error.message || "Please try again later",
          })
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [restaurantslug],
  )

  useEffect(() => {
    if (!restaurantslug) return
    fetchMenu(menuType, showStoppedItems)
  }, [restaurantslug, menuType, showStoppedItems, fetchMenu])

  useEffect(() => {
    if (!initialMenu) return
    setMenu(initialMenu)
    setCategories(initialMenu.categories || [])
    setMenuImages(initialMenu.menuImages || [])
  }, [initialMenu])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (orderSaveTimerRef.current) {
        window.clearTimeout(orderSaveTimerRef.current)
      }
    }
  }, [])

  const previewCategories = useMemo(() => {
    if (!showStoppedItems) return categories
    return categories
      .map((category) => ({
        ...category,
        menuItems: (category.menuItems || []).filter((item) => !item.isHidden),
      }))
      .filter((category) => category.menuItems.length > 0)
  }, [categories, showStoppedItems])

  // Toggle section collapse state
  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }, [])

  const scheduleOrderSave = useCallback(
    (nextCategories: ICategory[]) => {
      if (orderSaveTimerRef.current) {
        window.clearTimeout(orderSaveTimerRef.current)
      }
      setOrderSaving(true)
      orderSaveTimerRef.current = window.setTimeout(async () => {
        try {
          await MenuService.saveMenuOrder(restaurantslug, nextCategories, menuType)
        } catch (error: any) {
          console.error("Failed to auto-save order:", error)
          toast.error("فشل حفظ الترتيب", {
            description: "يرجى المحاولة مرة أخرى.",
          })
        } finally {
          setOrderSaving(false)
          orderSaveTimerRef.current = null
        }
      }, 600)
    },
    [restaurantslug, menuType],
  )

  const importFromBrand = useCallback(async () => {
    if (!restaurantslug) return
    setImporting(true)
    try {
      const result = await MenuService.importMenuItems(restaurantslug, menuType)
      await fetchMenu(menuType, showStoppedItems)
      toast.success("تم استيراد المنيو من البراند", {
        description: result.imported ? `تم ربط ${result.imported} صنف` : "لم يتم العثور على أصناف جديدة",
      })
    } catch (error: any) {
      console.error("Failed to import menu items:", error)
      toast.error("فشل استيراد المنيو", {
        description: error.message || "يرجى المحاولة مرة أخرى.",
      })
    } finally {
      setImporting(false)
    }
  }, [restaurantslug, menuType, fetchMenu, showStoppedItems])

  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return

      const { source, destination, type } = result

      setCategories((prevCategories) => {
        let nextCategories = prevCategories

        if (type === "section") {
          const reorderedCategories = [...prevCategories]
          const [removed] = reorderedCategories.splice(source.index, 1)
          reorderedCategories.splice(destination.index, 0, removed)
          nextCategories = reorderedCategories
        } else if (source.droppableId === destination.droppableId) {
          const sectionIndex = prevCategories.findIndex(
            (s) => s._id?.toString() === source.droppableId,
          )
          if (sectionIndex === -1) return prevCategories

          const newCategories = [...prevCategories]
          const sectionCopy = { ...newCategories[sectionIndex] }
          const items = [...sectionCopy.menuItems]
          const [removed] = items.splice(source.index, 1)
          items.splice(destination.index, 0, removed)
          sectionCopy.menuItems = items
          newCategories[sectionIndex] = sectionCopy
          nextCategories = newCategories
        } else {
          const sourceSectionIndex = prevCategories.findIndex(
            (s) => s._id?.toString() === source.droppableId,
          )
          const destSectionIndex = prevCategories.findIndex(
            (s) => s._id?.toString() === destination.droppableId,
          )

          if (sourceSectionIndex === -1 || destSectionIndex === -1) return prevCategories

          const newCategories = [...prevCategories]
          const sourceSectionCopy = { ...newCategories[sourceSectionIndex] }
          const destSectionCopy = { ...newCategories[destSectionIndex] }

          const sourceItems = [...sourceSectionCopy.menuItems]
          const destItems = [...destSectionCopy.menuItems]

          const [removed] = sourceItems.splice(source.index, 1)
          destItems.splice(destination.index, 0, removed)

          sourceSectionCopy.menuItems = sourceItems
          destSectionCopy.menuItems = destItems

          newCategories[sourceSectionIndex] = sourceSectionCopy
          newCategories[destSectionIndex] = destSectionCopy
          nextCategories = newCategories
        }

        scheduleOrderSave(nextCategories)
        return nextCategories
      })
    },
    [scheduleOrderSave],
  )

  const addNewSection = useCallback(async () => {
    try {
      const tempId = new Types.ObjectId().toString()

      // Create a temporary section with a local ID
      const newSection: ICategory = {
        _id: tempId as unknown as Types.ObjectId,
        name: {
          en: "New Section",
          ar: "قسم جديد",
        },
        menuItems: [],
      }

      // Optimistically update UI
      setCategories((prev) => [...prev, newSection])

      // If we have a menu ID, save to the API
      if (menuId) {
        try {
          const savedSection = await MenuService.addCategory(menuId, {
            name: newSection.name,
          })

          // Update the local state with the saved section that has a real ID
          setCategories((prev) =>
            prev.map((category) => (category._id?.toString() === tempId ? savedSection : category)),
          )

          // Set the editing section to the one with the real ID
          setEditingSection(savedSection)

          toast.success("Section added successfully")
        } catch (error: any) {
          // If API call fails, keep the local section but show an error
          console.error("Failed to save new section:", error)
          toast.error("Failed to save new section", {
            description: error.message || "Changes saved locally only",
          })
          setEditingSection(newSection)
        }
      } else {
        setEditingSection(newSection)
      }
    } catch (error: any) {
      toast.error("Failed to add section", {
        description: error.message || "Please try again later",
      })
    }
  }, [menuId])

  const addItemToSection = useCallback(
    async (sectionId: string) => {
      try {
        const tempId = new Types.ObjectId().toString()

        // Create a temporary item with a local ID
        const newItem: IMenuItem = {
          _id: tempId as unknown as Types.ObjectId,
          name: {
            en: "New Item",
            ar: "عنصر جديد",
          },
          description: {
            en: "",
            ar: "",
          },
          price: 0,
          image: "",
          sizes: [],
        }

        // Optimistically update UI
        setCategories((prevCategories) => {
          const sectionIndex = prevCategories.findIndex((s) => s._id?.toString() === sectionId)
          if (sectionIndex === -1) return prevCategories

          const updatedCategories = [...prevCategories]
          updatedCategories[sectionIndex] = {
            ...updatedCategories[sectionIndex],
            menuItems: [...updatedCategories[sectionIndex].menuItems, newItem],
          }

          return updatedCategories
        })

        // Set editing state to the new item
        setEditingItem(newItem)
        setEditingItemSectionId(sectionId)

        // If we have a menu ID, save to the API
      if (menuId) {
        try {
          const savedItem = await MenuService.addMenuItem(
            menuId,
            sectionId,
            {
            name: newItem.name,
            description: newItem.description,
            price: newItem.price,
            },
            menuType,
          )

            // Update the local state with the saved item that has a real ID
            setCategories((prevCategories) => {
              const sectionIndex = prevCategories.findIndex((s) => s._id?.toString() === sectionId)
              if (sectionIndex === -1) return prevCategories

              const updatedCategories = [...prevCategories]
              const updatedItems = updatedCategories[sectionIndex].menuItems.map((item) =>
                item._id?.toString() === tempId ? savedItem : item,
              )

              updatedCategories[sectionIndex] = {
                ...updatedCategories[sectionIndex],
                menuItems: updatedItems,
              }

              return updatedCategories
            })

            // Update editing state to the item with the real ID
            setEditingItem(savedItem)

            toast.success("Item added successfully")
          } catch (error: any) {
            // If API call fails, keep the local item but show an error
            console.error("Failed to save new item:", error)
            toast.error("Failed to save new item", {
              description: error.message || "Changes saved locally only",
            })
          }
        }
      } catch (error: any) {
        toast.error("Failed to add item", {
          description: error.message || "Please try again later",
        })
      }
    },
    [menuId, menuType],
  )

  const applyItemUpdate = useCallback((updatedItem: IMenuItem) => {
    setCategories((prevCategories) => {
      return prevCategories.map((category) => {
        const itemIndex = category.menuItems.findIndex((item) => item._id?.toString() === updatedItem._id?.toString())
        if (itemIndex !== -1) {
          const newItems = [...category.menuItems]
          newItems[itemIndex] = updatedItem
          return { ...category, menuItems: newItems }
        }
        return category
      })
    })
  }, [])

  const updateItem = useCallback(
    async (updatedItem: IMenuItem) => {
      applyItemUpdate(updatedItem)
      setEditingItem(null)
      setEditingItemSectionId(null)

      if (menuId && editingItemSectionId && updatedItem._id) {
        try {
          await MenuService.updateMenuItem(
            menuId,
            editingItemSectionId.toString(),
            updatedItem._id.toString(),
            updatedItem,
            menuType,
          )

          toast.success("Item updated successfully")
        } catch (error: any) {
          console.error("Failed to update item:", error)
          toast.error("Failed to update item", {
            description: error.message || "Changes saved locally only",
          })
        }
      }
    },
    [menuId, editingItemSectionId, applyItemUpdate, menuType],
  )

  const updateSection = useCallback(
    async (updatedSection: ICategory) => {
      // Optimistically update UI
      setCategories((prevCategories) => {
        return prevCategories.map((category) =>
          category._id?.toString() === updatedSection._id?.toString() ? updatedSection : category,
        )
      })

      setEditingSection(null)

      // If we have a menu ID, save to the API
      if (menuId && updatedSection._id) {
        try {
          await MenuService.updateCategory(menuId, updatedSection._id.toString(), updatedSection)

          toast.success("Section updated successfully")
        } catch (error: any) {
          console.error("Failed to update section:", error)
          toast.error("Failed to update section", {
            description: error.message || "Changes saved locally only",
          })
        }
      }
    },
    [menuId],
  )

  const deleteItem = useCallback(
    async (itemId: string) => {
      // Find the section that contains this item
      let categoryId: string | null = null
      let itemToDelete: IMenuItem | null = null

      categories.forEach((category) => {
        const item = category.menuItems.find((item) => item._id?.toString() === itemId)
        if (item) {
          categoryId = category._id?.toString() || null
          itemToDelete = item
        }
      })

      // Optimistically update UI
      setCategories((prevCategories) => {
        return prevCategories.map((category) => ({
          ...category,
          menuItems: category.menuItems.filter((item) => item._id?.toString() !== itemId),
        }))
      })

      // If we have a menu ID and category ID, delete from the API
      if (menuId && categoryId) {
        try {
          await MenuService.deleteMenuItem(menuId, categoryId, itemId, menuType)

          toast.success("Item deleted successfully")
        } catch (error: any) {
          console.error("Failed to delete item:", error)
          toast.error("Failed to delete item", {
            description: error.message || "Item removed locally only",
          })

          // If API call fails, restore the item
          if (categoryId && itemToDelete) {
            setCategories((prevCategories) => {
              return prevCategories.map((category) => {
                if (category._id?.toString() === categoryId && itemToDelete) {
                  return {
                    ...category,
                    menuItems: [...category.menuItems, itemToDelete],
                  }
                }
                return category
              })
            })
          }
        }
      }
    },
    [menuId, categories, menuType],
  )

  const deleteSection = useCallback(
    async (sectionId: string) => {
      // Find the section to potentially restore it
      const sectionToDelete = categories.find((category) => category._id?.toString() === sectionId)

      // Optimistically update UI
      setCategories((prevCategories) => prevCategories.filter((category) => category._id?.toString() !== sectionId))

      // If we have a menu ID, delete from the API
      if (menuId) {
        try {
          await MenuService.deleteCategory(menuId, sectionId)

          toast.success("Section deleted successfully")
        } catch (error: any) {
          console.error("Failed to delete section:", error)
          toast.error("Failed to delete section", {
            description: error.message || "Section removed locally only",
          })

          // If API call fails, restore the section
          if (sectionToDelete) {
            setCategories((prevCategories) => [...prevCategories, sectionToDelete])
          }
        }
      }
    },
    [menuId, categories],
  )

  const handleSaveMenu = useCallback(async () => {
    if (!menu) return

    try {
      setSaving(true)
      setError(null)

      // Create updated menu object
      const updatedMenu: IMenu = {
        ...menu,
        categories,
        menuImages,
        updatedAt: new Date(),
      }

      // Save to API
      await MenuService.saveMenuOrder(restaurantslug, categories, menuType)

      // Update local state
      setMenu(updatedMenu)

      toast.success("Menu saved successfully")
    } catch (error: any) {
      console.error("Failed to save menu:", error)
      setError(`Failed to save menu: ${error.message || "Unknown error"}`)
      toast.error("Failed to save menu", {
        description: error.message || "Please try again later",
      })
    } finally {
      setSaving(false)
    }
  }, [menu, categories, menuImages, restaurantslug, menuType])

  const toggleLanguage = useCallback(() => {
    setCurrentLanguage((prev) => (prev === "en" ? "ar" : "en"))
  }, [])

  const handleMenuTypeChange = useCallback(
    (nextType: MenuType) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("menuType", nextType)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const handleMenuTypeAdd = useCallback(
    (nextType: MenuType) => {
      handleMenuTypeChange(nextType)
      toast.success("تم تفعيل نوع المنيو", {
        description:
          nextType === "delivery" ? "دليفري" : nextType === "dinein" ? "صالة" : "تيك أواي",
      })
    },
    [handleMenuTypeChange],
  )

  if (loading) {
    return <MenuLoadingState />
  }

  if (error && !menu) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-12">
      

      <div className="mx-auto mt-8 max-w-6xl px-6">
        <header className="flex flex-wrap items-start justify-between gap-6 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/60">
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowStoppedItems((prev) => !prev)}
                className={cn(
                  "rounded-full border-slate-200 px-5",
                  showStoppedItems && "border-[#2e6fe6] bg-[#edf2ff] text-[#2e6fe6]",
                )}
              >
                {showStoppedItems ? "إخفاء الأصناف المتوقفة" : "إظهار الأصناف المتوقفة"}
              </Button>
              <Button
                variant="outline"
                onClick={importFromBrand}
                disabled={importing}
                className="rounded-full border-slate-200 px-5"
              >
                {importing ? "جاري الاستيراد..." : "استيراد من البراند"}
              </Button>
              {orderSaving ? (
                <span className="text-xs font-medium text-slate-500">جاري حفظ الترتيب...</span>
              ) : null}
              <MenuTypeSwitcher
                value={menuType}
                onChange={handleMenuTypeChange}
                onAdd={handleMenuTypeAdd}
              />
            </div>
           
          </div>

          
        </header>

        {error && (
          <Alert variant="destructive" className="mt-6 rounded-xl border-l-4 border-l-red-500 bg-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          {activeView === "preview" ? (
            menu ? (
              <MenuPreview menu={menu} categories={previewCategories} currentLanguage={currentLanguage} />
            ) : (
              <div className="rounded-3xl bg-white p-6 text-center text-sm text-muted-foreground">
                Loading menu preview...
              </div>
            )
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200/60">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections" type="section">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                      {categories.map((category, index) => (
                        <Draggable
                          key={category._id?.toString()}
                          draggableId={category._id?.toString() || `temp-${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
                            >
                              <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                                <div className="flex items-start gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white"
                                  >
                                    <GripVertical className="h-4 w-4 text-slate-400" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-[#2e6fe6]">
                                      <span className="font-semibold">Section</span>
                                      <span className="text-slate-300">•</span>
                                      <button
                                        onClick={() => setEditingSection(category)}
                                        className="flex items-center gap-1 text-xs font-medium text-[#2e6fe6] hover:underline"
                                      >
                                        <Edit className="h-3.5 w-3.5" /> Edit details
                                      </button>
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900">
                                      {category.name[currentLanguage] || category.name.en}
                                    </h3>
                                    {category.description && category.description[currentLanguage] && (
                                      <p className="max-w-2xl text-sm text-slate-500">
                                        {category.description[currentLanguage]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => setEditingSection(category)}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => deleteSection(category._id?.toString() || "")}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <button
                                    onClick={() => toggleSectionCollapse(category._id?.toString() || "")}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                                  >
                                    {collapsedSections[category._id?.toString() || ""] ? (
                                      <ChevronRight className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {!collapsedSections[category._id?.toString() || ""] && (
                                <Droppable droppableId={category._id?.toString() || `temp-${index}`} type="item">
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                      className="divide-y divide-slate-100"
                                    >
                                      {category.menuItems.map((item, itemIndex) => (
                                        <Draggable
                                          key={item._id?.toString()}
                                          draggableId={item._id?.toString() || `temp-item-${itemIndex}`}
                                          index={itemIndex}
                                        >
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={cn(
                                                "group flex items-center justify-between gap-4 bg-white px-6 py-5 transition hover:bg-[#f1f6ff]",
                                                item.isHidden ? "opacity-60" : "",
                                              )}
                                            >
                                              <div className="flex items-start gap-4">
                                                <div
                                                  {...provided.dragHandleProps}
                                                  className="mt-2 flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-200 bg-white text-slate-400"
                                                >
                                                  <GripVertical className="h-4 w-4" />
                                                </div>
                                                <div className="space-y-1">
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-base font-semibold text-slate-900">
                                                      {item.name[currentLanguage] || item.name.en || "New Item"}
                                                    </h4>
                                                    {(() => {
                                                      const status =
                                                        item.linkStatus ?? (item.isHidden ? "stopped" : "linked")
                                                      if (status === "linked") {
                                                        return (
                                                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                            مرتبط بالمطعم
                                                          </span>
                                                        )
                                                      }
                                                      if (status === "unlinked") {
                                                        return (
                                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                            غير مرتبط
                                                          </span>
                                                        )
                                                      }
                                                      return (
                                                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                                          متوقف
                                                        </span>
                                                      )
                                                    })()}
                                                    {item.isAvailable === false ? (
                                                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                        غير متاح
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                  {item.description && item.description[currentLanguage] && (
                                                    <p className="max-w-2xl text-sm text-slate-500 line-clamp-2">
                                                      {item.description[currentLanguage]}
                                                    </p>
                                                  )}
                                                  {item.sizes && item.sizes.length > 0 && (
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                      {item.sizes.length} variants
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <span className="text-right text-sm font-semibold text-slate-900">
                                                  {item.price
                                                    ? `${item.price.toFixed(2)} ${menu?.currency?.[currentLanguage] || menu?.currency?.en || "€"}`
                                                    : item.sizes && item.sizes.length > 0
                                                      ? `${item.sizes[0].price?.toFixed?.(2) ?? item.sizes[0].price} - ${
                                                          item.sizes[item.sizes.length - 1].price?.toFixed?.(2) ??
                                                          item.sizes[item.sizes.length - 1].price
                                                        } ${menu?.currency?.[currentLanguage] || menu?.currency?.en || "€"}`
                                                      : "—"}
                                                </span>
                                                {item.image && (
                                                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                                                    <img
                                                      src={item.image || "/placeholder.svg"}
                                                      alt={item.name[currentLanguage] || item.name.en || ""}
                                                      className="h-full w-full object-cover"
                                                      onError={(e) => {
                                                        ;(e.target as HTMLImageElement).src =
                                                          "/placeholder.svg?height=48&width=48"
                                                      }}
                                                    />
                                                  </div>
                                                )}
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="rounded-full text-slate-500 hover:bg-[#eaf2ff] hover:text-[#2e6fe6]"
                                                  onClick={() => {
                                                    setEditingItem(item)
                                                    setEditingItemSectionId(category._id?.toString() || "")
                                                  }}
                                                >
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                      <div className="px-6 py-4">
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start gap-2 rounded-2xl bg-[#f7f9ff] text-[#2e6fe6] hover:bg-[#edf2ff]"
                                          onClick={() => addItemToSection(category._id?.toString() || "")}
                                        >
                                          <Plus className="h-4 w-4" /> Quick Add item
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Droppable>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <div className="mt-8 flex flex-col gap-3 rounded-3xl bg-slate-50 p-6 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl border-dashed border-slate-300 bg-white px-6 py-6 text-[#2e6fe6] hover:border-[#2e6fe6]"
                  onClick={addNewSection}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Section
                </Button>
                <Button
                  className="flex-1 rounded-2xl bg-[#2e6fe6] px-6 py-6 text-base font-semibold shadow hover:bg-[#2357b9]"
                  onClick={handleSaveMenu}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Menu
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {editingItem && menu && (
        <EditItemModal
          item={editingItem}
          currency={menu.currency}
          restaurantslug={restaurantslug}
          restaurantId={restaurantId}
          initialMenuType={menuType}
          onSave={(updated) => {
            applyItemUpdate(updated)
            setEditingItem(null)
            setEditingItemSectionId(null)
          }}
          onCancel={() => {
            setEditingItem(null)
            setEditingItemSectionId(null)
          }}
          onDelete={() => {
            deleteItem(editingItem._id?.toString() || "")
            setEditingItem(null)
            setEditingItemSectionId(null)
          }}
        />
      )}

      {editingSection && (
        <EditSectionModal
          section={editingSection}
          onSave={updateSection}
          onCancel={() => setEditingSection(null)}
          onDelete={() => {
            deleteSection(editingSection._id?.toString() || "")
            setEditingSection(null)
          }}
        />
      )}

      {menu && (
        <MenuImageManager
          open={imageManagerOpen}
          onOpenChange={setImageManagerOpen}
          images={menuImages}
          subdomain={menu.name}
          onImagesChange={setMenuImages}
        />
      )}
    </div>
  )
}
