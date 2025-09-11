"use client"

import { useState, useEffect, useRef } from "react"
import {
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  X,
  ArrowUpDown,
  Save,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import EditMenuItem from "./edit-menu-item"

interface MenuItem {
  id: string
  name: { en: string; ar: string }
  price: number
  description?: { en: string; ar: string }
  image?: string
  dietary?: string[]
  variants?: { id: string; name: string; price: number }[]
}

interface Category {
  id: string
  name: { en: string; ar: string }
  description?: { en: string; ar: string }
  menuItems: MenuItem[]
}

interface MenuData {
  _id: string
  restaurantId: string
  name: string
  categories: Category[]
  menuImages?: string[]
}

interface MenuManagerProps {
  subdomain: string
}

export function MenuManager({ subdomain }: MenuManagerProps) {
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "ar">("en")
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDietary, setFilterDietary] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<{ categoryId: string; itemId: string } | null>(null)
  const [reorderMode, setReorderMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const dragItem = useRef<{ categoryId: string; itemIndex: number } | null>(null)
  const dragOverItem = useRef<{ categoryId: string; itemIndex: number } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMenuItems()
  }, [subdomain])

  const fetchMenuItems = async () => {
    setIsLoading(true)
    try {
      // Simulate API call with a delay
      setTimeout(() => {
        // Mock data
        const mockData: MenuData = {
          _id: "menu123",
          restaurantId: "rest123",
          name: "Dinner Menu",
          categories: [
            {
              id: "cat1",
              name: { en: "Appetizers", ar: "المقبلات" },
              description: {
                en: "Start your meal with these delicious options",
                ar: "ابدأ وجبتك بهذه الخيارات اللذيذة",
              },
              menuItems: [
                {
                  id: "item1",
                  name: { en: "Garlic Bread", ar: "خبز بالثوم" },
                  price: 5.99,
                  description: { en: "Freshly baked bread with garlic butter", ar: "خبز طازج مع زبدة الثوم" },
                  dietary: ["vegetarian"],
                },
                {
                  id: "item2",
                  name: { en: "Mozzarella Sticks", ar: "أصابع الموزاريلا" },
                  price: 7.99,
                  description: { en: "Crispy fried cheese sticks", ar: "أصابع الجبن المقلية المقرمشة" },
                  dietary: ["vegetarian"],
                },
              ],
            },
            {
              id: "cat2",
              name: { en: "Main Courses", ar: "الأطباق الرئيسية" },
              description: { en: "Our signature dishes", ar: "أطباقنا المميزة" },
              menuItems: [
                {
                  id: "item3",
                  name: { en: "Grilled Salmon", ar: "سلمون مشوي" },
                  price: 18.99,
                  description: { en: "Fresh salmon with herbs", ar: "سلمون طازج مع الأعشاب" },
                  dietary: ["seafood"],
                },
                {
                  id: "item4",
                  name: { en: "Beef Steak", ar: "ستيك لحم البقر" },
                  price: 24.99,
                  description: { en: "Premium cut beef steak", ar: "ستيك لحم البقر من قطع ممتازة" },
                  variants: [
                    { id: "v1", name: "Rare", price: 24.99 },
                    { id: "v2", name: "Medium", price: 24.99 },
                    { id: "v3", name: "Well Done", price: 26.99 },
                  ],
                },
              ],
            },
          ],
        }

        setMenuData(mockData)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error fetching menu items:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Failed to load menu data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getDietaryIcon = (type: string) => {
    switch (type) {
      case "vegetarian":
        return "🥦"
      case "vegan":
        return "🌱"
      case "seafood":
        return "🐟"
      case "spicy":
        return "🌶️"
      case "gluten-free":
        return "🌾"
      case "dairy-free":
        return "🥛"
      case "nuts":
        return "🥜"
      default:
        return "•"
    }
  }

  const handleDragStart = (categoryId: string, itemIndex: number) => {
    dragItem.current = { categoryId, itemIndex }
  }

  const handleDragEnter = (categoryId: string, itemIndex: number) => {
    dragOverItem.current = { categoryId, itemIndex }
  }

  const handleDrop = () => {
    if (!dragItem.current || !dragOverItem.current || !menuData) return

    const newMenuData = { ...menuData }

    // Find the source and target categories
    const sourceCategoryIndex = newMenuData.categories.findIndex((cat) => cat.id === dragItem.current?.categoryId)
    const targetCategoryIndex = newMenuData.categories.findIndex((cat) => cat.id === dragOverItem.current?.categoryId)

    if (sourceCategoryIndex === -1 || targetCategoryIndex === -1) return

    // Get the item being dragged
    const draggedItem = newMenuData.categories[sourceCategoryIndex].menuItems[dragItem.current.itemIndex]

    // Remove from source
    newMenuData.categories[sourceCategoryIndex].menuItems.splice(dragItem.current.itemIndex, 1)

    // Add to target
    newMenuData.categories[targetCategoryIndex].menuItems.splice(dragOverItem.current.itemIndex, 0, draggedItem)

    setMenuData(newMenuData)
    setHasUnsavedChanges(true)

    // Reset
    dragItem.current = null
    dragOverItem.current = null
  }

  const handleSaveOrder = () => {
    // Simulate saving to API
    toast({
      title: "Order saved",
      description: "Your menu item order has been updated.",
    })
    setReorderMode(false)
    setHasUnsavedChanges(false)
  }

  const handleSaveItem = async (updatedItem: MenuItem) => {
    if (!menuData) return

    const newMenuData = { ...menuData }

    // Find the category containing the item
    const categoryIndex = newMenuData.categories.findIndex((category) =>
      category.menuItems.some((item) => item.id === updatedItem.id),
    )

    if (categoryIndex === -1) return

    // Find the item index
    const itemIndex = newMenuData.categories[categoryIndex].menuItems.findIndex((item) => item.id === updatedItem.id)

    if (itemIndex === -1) return

    // Update the item
    newMenuData.categories[categoryIndex].menuItems[itemIndex] = updatedItem

    // Simulate API call
    setMenuData(newMenuData)

    toast({
      title: "Item updated",
      description: `${updatedItem.name.en} has been updated successfully.`,
    })
  }

  const handleDeleteItem = () => {
    if (!itemToDelete || !menuData) return

    const newMenuData = { ...menuData }

    // Find the category
    const categoryIndex = newMenuData.categories.findIndex((cat) => cat.id === itemToDelete.categoryId)

    if (categoryIndex === -1) return

    // Remove the item
    newMenuData.categories[categoryIndex].menuItems = newMenuData.categories[categoryIndex].menuItems.filter(
      (item) => item.id !== itemToDelete.itemId,
    )

    setMenuData(newMenuData)
    setItemToDelete(null)

    toast({
      title: "Item deleted",
      description: "The menu item has been removed.",
    })
  }

  const addNewItem = (categoryId: string) => {
    if (!menuData) return

    const newMenuData = { ...menuData }

    // Find the category
    const categoryIndex = newMenuData.categories.findIndex((cat) => cat.id === categoryId)

    if (categoryIndex === -1) return

    // Create new item
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: { en: "New Item", ar: "عنصر جديد" },
      price: 0,
      description: { en: "", ar: "" },
    }

    // Add to category
    newMenuData.categories[categoryIndex].menuItems.push(newItem)

    setMenuData(newMenuData)
    setEditingItem(newItem)
  }

  const filteredCategories = menuData?.categories.map((category) => {
    // Filter items based on search query and dietary filter
    const filteredItems = category.menuItems.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.ar?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDietary = !filterDietary || item.dietary?.includes(filterDietary)

      return matchesSearch && matchesDietary
    })

    return {
      ...category,
      menuItems: filteredItems,
    }
  })

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <nav className="flex items-center text-sm text-muted-foreground mb-4">
        <span>Restaurant Menus</span>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span>Dinner Menu</span>
      </nav>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dinner Menu</h1>
          <Button variant="outline" className="mt-2">
            Change Menu <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {reorderMode ? (
            <>
              <Button variant="outline" onClick={() => setReorderMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveOrder} disabled={!hasUnsavedChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Order
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setReorderMode(true)}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Reorder Items
              </Button>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button variant="outline">Edit menu details</Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={filterDietary || "all"} onValueChange={(value) => setFilterDietary(value || null)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by dietary" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All items</SelectItem>
              <SelectItem value="vegetarian">Vegetarian 🥦</SelectItem>
              <SelectItem value="vegan">Vegan 🌱</SelectItem>
              <SelectItem value="gluten-free">Gluten Free 🌾</SelectItem>
              <SelectItem value="dairy-free">Dairy Free 🥛</SelectItem>
              <SelectItem value="spicy">Spicy 🌶️</SelectItem>
              <SelectItem value="seafood">Seafood 🐟</SelectItem>
            </SelectContent>
          </Select>
          <Select value={currentLanguage} onValueChange={(value: "en" | "ar") => setCurrentLanguage(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg">
              <Skeleton className="h-8 w-1/4 mb-4" />
              <Skeleton className="h-4 w-2/3 mb-6" />

              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-6 w-6" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCategories?.map((category) => (
            <div key={category.id} className="bg-white rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold">{category.name[currentLanguage]}</h2>
                <Badge variant="secondary" className="cursor-pointer">
                  <GripVertical className="h-4 w-4 mr-1" />
                  Link
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">{category.description?.[currentLanguage]}</p>

              {category.menuItems.length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No items match your filters</p>
                </div>
              )}

              <div className="space-y-4">
                {category.menuItems.map((item, itemIndex) => (
                  <div key={item.id}>
                    <div
                      className={`group flex items-start gap-4 p-4 hover:bg-accent rounded-lg transition-colors ${
                        reorderMode ? "cursor-move" : ""
                      }`}
                      draggable={reorderMode}
                      onDragStart={() => reorderMode && handleDragStart(category.id, itemIndex)}
                      onDragEnter={() => reorderMode && handleDragEnter(category.id, itemIndex)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => reorderMode && handleDrop()}
                    >
                      <Button
                        variant="ghost"
                        className={`p-2 ${reorderMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{item.name[currentLanguage]}</h3>
                            <p className="text-sm text-muted-foreground">{item.description?.[currentLanguage]}</p>
                          </div>

                          <div className="flex items-center gap-4">
                            {item.variants ? (
                              <div className="text-sm">
                                {`${item.variants[0].price.toFixed(2)} - ${item.variants[item.variants.length - 1].price.toFixed(2)} EGP`}
                                <div className="text-xs text-muted-foreground">{item.variants.length} variants</div>
                              </div>
                            ) : (
                              <div className="text-sm">{item.price.toFixed(2)} EGP</div>
                            )}

                            <div className="flex gap-2">
                              {item.dietary?.map((type, index) => (
                                <span key={index} title={type} className="text-lg">
                                  {getDietaryIcon(type)}
                                </span>
                              ))}
                            </div>

                            {item.image && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden">
                                <img
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name[currentLanguage]}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {!reorderMode && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingItem(item)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit item
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setItemToDelete({ categoryId: category.id, itemId: item.id })}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete item
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>

              <Button variant="outline" className="mt-4" onClick={() => addNewItem(category.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" className="w-full justify-start">
        <Plus className="h-4 w-4 mr-2" />
        Quick Add
      </Button>

      {editingItem && (
        <EditMenuItem
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          onSave={handleSaveItem}
        />
      )}

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this menu item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

