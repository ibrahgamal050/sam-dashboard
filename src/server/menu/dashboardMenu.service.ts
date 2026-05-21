import mongoose, { type FilterQuery } from "mongoose"
import dbConnect from "@/lib/dbConnect"
import Brand from "@/models/Brand"
import BrandMenuCategory from "@/models/BrandMenuCategory"
import BrandMenuItem from "@/models/BrandMenuItem"
import Restaurant from "@/models/Restaurant"
import Menu from "@/models/RestaurantMenu"
import RestaurantMenuItem, { type IRestaurantMenuItem } from "@/models/RestaurantMenuItem"
import { MENU_TYPES, type MenuType } from "@/lib/menu-types"

type MenuContext = {
  restaurant: any
  brand: any | null
  restaurantId: string
  brandId: string | null
}

type MenuContextResult =
  | { ok: true; context: MenuContext }
  | { ok: false; status: number; message: string }

type MenuTypeOverrideInput = {
  price?: number | null
  isHidden?: boolean
  isAvailable?: boolean
  order?: number | null
}

type UpdateItemOverridesInput = {
  itemId: string
  overrides?: Partial<Record<MenuType, MenuTypeOverrideInput>>
  globalHidden?: boolean
  resetMenuTypes?: MenuType[]
  base?: {
    name?: { ar?: string; en?: string }
    sizes?: { label: string; price?: number }[]
  }
}

type RestaurantContextLean = {
  _id: mongoose.Types.ObjectId
  brandId?: mongoose.Types.ObjectId | null
}

type BrandContextLean = {
  _id: mongoose.Types.ObjectId
}

type BrandMenuItemLean = {
  _id: mongoose.Types.ObjectId
  name?: { ar?: string; en?: string }
  description?: unknown
  category?: string
  price?: number | null
  images?: Array<{ url?: string }>
  sizes?: Array<{ label: string; price?: number }>
  weight?: string
  order?: number
  isAvailable?: boolean
  isActive?: boolean
}

const pickName = (value: any) => value?.ar || value?.en || ""

const normalizeCategoryName = (value?: string) => (value || "غير مصنف").trim()

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const buildRestaurantQuery = (restaurantslug: string) => {
  const escaped = escapeRegExp(restaurantslug)
  const regex = new RegExp(`^${escaped}$`, "i")
  return {
    $or: [{ subdomain: { $regex: regex } }, { slug: { $regex: regex } }],
  }
}

export async function resolveDashboardMenuContext(
  restaurantslug: string,
): Promise<MenuContextResult> {
  await dbConnect()

  const restaurant = await Restaurant.findOne(buildRestaurantQuery(restaurantslug)).lean<RestaurantContextLean | null>()
  if (!restaurant) {
    return { ok: false, status: 404, message: "Restaurant not found." }
  }

  const brand = restaurant.brandId
    ? await Brand.findById(restaurant.brandId).lean<BrandContextLean | null>()
    : null

  return {
    ok: true,
    context: {
      restaurant,
      brand,
      restaurantId: String(restaurant._id),
      brandId: brand ? String(brand._id) : null,
    },
  }
}

export async function getDashboardMenu(
  context: MenuContext,
  menuType: MenuType,
  options?: { includeHidden?: boolean },
) {
  const { brand, brandId, restaurant, restaurantId } = context
  const includeHidden = Boolean(options?.includeHidden)

  if (!brand || !brandId) {
    const legacyMenu = await Menu.findOne({ restaurantId: restaurant._id }).lean<any | null>()
    return {
      _id: legacyMenu?._id || restaurant._id,
      restaurantId,
      name: legacyMenu?.name || "Menu",
      currency: { ar: "ج.م", en: "EGP" },
      categories: legacyMenu?.categories || [],
      menuImages: legacyMenu?.menuImages || [],
    }
  }

  const overrideFilter: Record<string, any> = {
    restaurantId: restaurant._id,
    brandMenuItemId: { $ne: null },
  }
  if (menuType === "delivery") {
    overrideFilter.$or = [{ menuType }, { menuType: { $exists: false } }]
  } else {
    overrideFilter.menuType = menuType
  }

  const overrides = await RestaurantMenuItem.find(overrideFilter).lean()

  const overrideMap = new Map<string, any>()
  overrides.forEach((override) => {
    if (!override?.brandMenuItemId) return
    const key = String(override.brandMenuItemId)
    if (!overrideMap.has(key)) {
      overrideMap.set(key, override)
      return
    }
    if (override?.menuType === menuType) {
      overrideMap.set(key, override)
    }
  })

  const brandItems = includeHidden
    ? await BrandMenuItem.find({ brandId })
        .sort({ order: 1, createdAt: -1 })
        .lean<BrandMenuItemLean[]>()
    : await (async () => {
        const brandItemIds = Array.from(overrideMap.keys())
        return brandItemIds.length
          ? BrandMenuItem.find({
              _id: { $in: brandItemIds },
              brandId,
            })
              .sort({ order: 1, createdAt: -1 })
              .lean<BrandMenuItemLean[]>()
          : []
      })()

  const itemsByCategory = new Map<string, any[]>()
  brandItems.forEach((item) => {
    const override = overrideMap.get(String(item._id))
    if (!override) return

    const hasOverride = Boolean(override)
    const isStopped = hasOverride && (override?.isActive === false || override?.isHidden === true)
    const linkStatus = hasOverride ? (isStopped ? "stopped" : "linked") : "unlinked"
    const isHidden = linkStatus !== "linked"
    if (!includeHidden && isHidden) return

    const categoryName = normalizeCategoryName(override?.category || item.category)
    const effectiveOrder =
      typeof override?.order === "number"
        ? override.order
        : typeof item.order === "number"
          ? item.order
          : 0

    const menuItem = {
      _id: item._id,
      name: override?.name || item.name,
      description: override?.description || item.description,
      price: typeof override?.price === "number" ? override.price : item.price,
      image: override?.images?.[0]?.url || item.images?.[0]?.url || "",
      sizes: (override?.sizes?.length ? override.sizes : item.sizes || []).map((size: any) => ({
        _id: new mongoose.Types.ObjectId(),
        name: { ar: size.label, en: size.label },
        price: size.price,
      })),
      weight: override?.weight || item.weight,
      isAvailable:
        typeof override?.isAvailable === "boolean"
          ? override.isAvailable
          : item.isAvailable ?? true,
      linkStatus,
      isHidden,
      sortOrder: effectiveOrder,
      order: effectiveOrder,
    }

    const bucket = itemsByCategory.get(categoryName)
    if (bucket) {
      bucket.push(menuItem)
    } else {
      itemsByCategory.set(categoryName, [menuItem])
    }
  })

  const categoriesFromItems = Array.from(itemsByCategory.keys())

  const existingCategories = await BrandMenuCategory.find({
    brandId,
    isActive: true,
  })
    .sort({ order: 1, createdAt: -1 })
    .lean()

  const existingNames = new Set(existingCategories.map((cat) => cat.name?.ar).filter(Boolean))
  const missingNames = categoriesFromItems.filter((name) => name && !existingNames.has(name))

  if (missingNames.length) {
    await BrandMenuCategory.insertMany(
      missingNames.map((name, index) => ({
        brandId,
        name: { ar: name, en: "" },
        order: existingCategories.length + index,
        isActive: true,
      })),
      { ordered: false },
    ).catch(() => null)
  }

  const categories = missingNames.length
    ? await BrandMenuCategory.find({ brandId, isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .lean()
    : existingCategories

  const menuCategories = categories
    .filter((cat) => categoriesFromItems.includes(normalizeCategoryName(cat.name?.ar)))
    .map((cat) => {
      const categoryName = normalizeCategoryName(cat.name?.ar)
      const itemsForCategory = itemsByCategory.get(categoryName) || []
      const menuItems = itemsForCategory.sort((a: any, b: any) => {
        const aOrder = typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER
        const bOrder = typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER
        if (aOrder !== bOrder) return aOrder - bOrder
        return 0
      })

      return {
        _id: cat._id,
        name: { ar: cat.name?.ar || categoryName, en: cat.name?.en || "" },
        menuItems,
      }
    })

  return {
    _id: brand._id,
    restaurantId,
    name: pickName(brand.name) || brand.slug,
    currency: { ar: "ج.م", en: "EGP" },
    categories: menuCategories,
    menuImages: [],
  }
}

const buildOverrideFilter = (
  restaurantId: mongoose.Types.ObjectId,
  brandMenuItemId: mongoose.Types.ObjectId,
  menuType: MenuType,
): FilterQuery<IRestaurantMenuItem> => {
  if (menuType === "delivery") {
    return {
      restaurantId,
      brandMenuItemId,
      $or: [{ menuType }, { menuType: { $exists: false } }],
    }
  }
  return { restaurantId, brandMenuItemId, menuType }
}

export async function updateDashboardMenuItemOverrides(
  context: MenuContext,
  input: UpdateItemOverridesInput,
) {
  const { restaurant, brand } = context
  if (!brand) {
    return { ok: false as const, status: 400, message: "This restaurant uses the legacy menu format." }
  }
  const { itemId, overrides = {}, globalHidden = false, resetMenuTypes = [], base } = input

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    return { ok: false as const, status: 400, message: "Invalid item id." }
  }
  const itemObjectId = new mongoose.Types.ObjectId(itemId)

  const baseItem = await BrandMenuItem.findOne({ _id: itemId, brandId: brand._id }).lean<BrandMenuItemLean | null>()
  if (!baseItem) {
    return { ok: false as const, status: 404, message: "Menu item not found." }
  }

  if (base) {
    const baseUpdate: Record<string, any> = {}
    if (base.name) {
      baseUpdate.name = {
        ar: String(base.name.ar ?? baseItem.name?.ar ?? "").trim(),
        en: String(base.name.en ?? baseItem.name?.en ?? "").trim(),
      }
    }
    if (Array.isArray(base.sizes)) {
      baseUpdate.sizes = base.sizes
        .filter((size) => size && typeof size.label === "string" && size.label.trim())
        .map((size) => ({
          label: size.label.trim(),
          price: typeof size.price === "number" ? size.price : undefined,
        }))
    }
    if (Object.keys(baseUpdate).length) {
      await BrandMenuItem.updateOne({ _id: itemId, brandId: brand._id }, { $set: baseUpdate })
    }
  }

  const basePrice = typeof baseItem.price === "number" ? baseItem.price : null
  const baseAvailable = baseItem.isAvailable ?? true
  const baseOrder = typeof baseItem.order === "number" ? baseItem.order : 0
  const baseHidden = baseItem.isActive === false

  const operations: any[] = []

  resetMenuTypes.forEach((menuType) => {
    operations.push({
      deleteOne: {
        filter: buildOverrideFilter(restaurant._id, itemObjectId, menuType),
      },
    })
  })

  if (globalHidden) {
    MENU_TYPES.forEach((menuType) => {
      operations.push({
        updateOne: {
          filter: buildOverrideFilter(restaurant._id, itemObjectId, menuType),
          update: {
            $set: {
              restaurantId: restaurant._id,
              brandMenuItemId: itemObjectId,
              menuType,
              isHidden: true,
              isActive: false,
            },
          },
          upsert: true,
        },
      })
    })
  }

  Object.entries(overrides).forEach(([menuTypeRaw, override]) => {
    const menuType = menuTypeRaw as MenuType
    if (!override) return

    const nextPrice = override.price ?? null
    const nextAvailable = typeof override.isAvailable === "boolean" ? override.isAvailable : undefined
    const nextHidden = typeof override.isHidden === "boolean" ? override.isHidden : undefined
    const nextOrder = override.order ?? null

    const set: Record<string, any> = {
      restaurantId: restaurant._id,
      brandMenuItemId: itemObjectId,
      menuType,
    }
    const unset: Record<string, "" > = {}

    if (typeof nextPrice === "number" && nextPrice !== basePrice) {
      set.price = nextPrice
    } else if (nextPrice === null || nextPrice === basePrice) {
      unset.price = ""
    }

    if (typeof nextAvailable === "boolean" && nextAvailable !== baseAvailable) {
      set.isAvailable = nextAvailable
    } else if (nextAvailable === undefined || nextAvailable === baseAvailable) {
      unset.isAvailable = ""
    }

    const effectiveHidden = globalHidden ? true : nextHidden
    if (typeof effectiveHidden === "boolean" && effectiveHidden !== baseHidden) {
      set.isHidden = effectiveHidden
      set.isActive = !effectiveHidden
    } else if (effectiveHidden === undefined || effectiveHidden === baseHidden) {
      unset.isHidden = ""
      unset.isActive = ""
    }

    if (typeof nextOrder === "number" && nextOrder !== baseOrder) {
      set.order = nextOrder
    } else if (nextOrder === null || nextOrder === baseOrder) {
      unset.order = ""
    }

    const hasOverrides =
      "price" in set ||
      "isAvailable" in set ||
      "isHidden" in set ||
      "order" in set

    if (!hasOverrides && !globalHidden) {
      operations.push({
        deleteOne: { filter: buildOverrideFilter(restaurant._id, itemObjectId, menuType) },
      })
      return
    }

    const update: Record<string, any> = { $set: set }
    if (Object.keys(unset).length) {
      update.$unset = unset
    }

    operations.push({
      updateOne: {
        filter: buildOverrideFilter(restaurant._id, itemObjectId, menuType),
        update,
        upsert: true,
      },
    })
  })

  if (operations.length) {
    await RestaurantMenuItem.bulkWrite(operations)
  }

  return { ok: true as const }
}

export async function saveDashboardMenuOrder(
  context: MenuContext,
  categories: any[],
  menuType: MenuType,
) {
  const { brand, restaurant } = context

  if (!brand) {
    await Menu.updateOne(
      { restaurantId: restaurant._id },
      { $set: { categories } },
      { upsert: false },
    )
    return
  }

  const categoryUpdates = categories
    .map((category: any, index: number) => ({
      category,
      index,
    }))
    .filter((entry) => entry.category?._id)
    .map((entry) => ({
      updateOne: {
        filter: { _id: entry.category._id, brandId: brand._id },
        update: { $set: { order: entry.index } },
      },
    }))

  if (categoryUpdates.length) {
    await BrandMenuCategory.bulkWrite(categoryUpdates)
  }

  const itemUpdates: any[] = []

  categories.forEach((category: any) => {
    const items = Array.isArray(category?.menuItems) ? category.menuItems : []
    items.forEach((item: any, itemIndex: number) => {
      if (!item?._id) return
      itemUpdates.push({
        updateOne: {
          filter: buildOverrideFilter(restaurant._id, item._id, menuType),
          update: {
            $set: { order: itemIndex },
            $setOnInsert: {
              restaurantId: restaurant._id,
              brandMenuItemId: item._id,
              menuType,
              isAvailable: true,
              isActive: true,
            },
          },
          upsert: true,
        },
      })
    })
  })

  if (itemUpdates.length) {
    await RestaurantMenuItem.bulkWrite(itemUpdates)
  }
}

export async function importBrandMenuItems(context: MenuContext, menuType: MenuType) {
  const { brand, restaurant } = context

  if (!brand) {
    return { ok: true, imported: 0 }
  }

  const items = await BrandMenuItem.find({ brandId: brand._id, isActive: true }).lean<BrandMenuItemLean[]>()
  if (!items.length) {
    return { ok: true, imported: 0 }
  }

  const operations: Parameters<typeof RestaurantMenuItem.bulkWrite>[0] = items.map((item) => {
    const setOnInsert: Partial<IRestaurantMenuItem> = {
      restaurantId: restaurant._id,
      brandMenuItemId: item._id,
      order: typeof item.order === "number" ? item.order : 0,
      isAvailable: item.isAvailable ?? true,
      isActive: true,
    }
    if (typeof item.price === "number") {
      setOnInsert.price = item.price
    }

    return {
      updateOne: {
        filter: buildOverrideFilter(restaurant._id, item._id, menuType),
        update: {
          $set: { menuType },
          $setOnInsert: setOnInsert,
        },
        upsert: true,
      },
    }
  })

  const result = await RestaurantMenuItem.bulkWrite(operations)
  return { ok: true, imported: result.upsertedCount ?? 0 }
}
