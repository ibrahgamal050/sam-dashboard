import type { ICategory, IMenu, IMenuItem } from "@/types/menu"
import type { MenuType } from "@/lib/menu-types"

class RequestError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "RequestError"
    this.status = status
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const data = await response.json()
      if (typeof data?.error === "string") {
        message = data.error
      } else if (typeof data?.message === "string") {
        message = data.message
      }
    } catch (error) {
      // Ignore parse errors – fall back to default message
    }
    throw new RequestError(message, response.status)
  }

  return response.status === 204 ? (undefined as unknown as T) : ((await response.json()) as T)
}

export class MenuService {
  private static readonly legacyBaseUrl = "/api/menus"
  private static readonly dashboardBaseUrl = "/api/dashboard/restaurants"
  private static restaurantId: string | null = null

  static setRestaurantId(restaurantId?: string | null) {
    this.restaurantId = restaurantId || null
  }

  private static buildHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.restaurantId) {
      headers["x-restaurant-id"] = this.restaurantId
    }

    return headers
  }

  static async getMenu(
    restaurantslug: string,
    menuType: MenuType,
    options?: { signal?: AbortSignal; showHidden?: boolean },
  ): Promise<IMenu> {
    const params = new URLSearchParams({ menuType })
    if (options?.showHidden) {
      params.set("showHidden", "1")
    }
    const response = await fetch(
      `${this.dashboardBaseUrl}/${encodeURIComponent(restaurantslug)}/menu?${params.toString()}`,
      {
      method: "GET",
      headers: this.buildHeaders(),
      cache: "no-store",
      signal: options?.signal,
      },
    )

    return handleResponse<IMenu>(response)
  }

  static async addCategory(menuId: string, category: Partial<ICategory>): Promise<ICategory> {
    const response = await fetch(`${this.legacyBaseUrl}/${menuId}/categories`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(category),
    })

    return handleResponse<ICategory>(response)
  }

  static async updateCategory(menuId: string, categoryId: string, category: Partial<ICategory>): Promise<ICategory> {
    const response = await fetch(`${this.legacyBaseUrl}/${menuId}/categories/${categoryId}`, {
      method: "PUT",
      headers: this.buildHeaders(),
      body: JSON.stringify(category),
    })

    return handleResponse<ICategory>(response)
  }

  static async deleteCategory(menuId: string, categoryId: string): Promise<void> {
    const response = await fetch(`${this.legacyBaseUrl}/${menuId}/categories/${categoryId}`, {
      method: "DELETE",
      headers: this.buildHeaders(),
    })

    await handleResponse<void>(response)
  }

  static async addMenuItem(
    menuId: string,
    categoryId: string,
    item: Partial<IMenuItem>,
    menuType?: MenuType,
  ): Promise<IMenuItem> {
    const params = new URLSearchParams()
    if (menuType) {
      params.set("menuType", menuType)
    }
    const query = params.toString()
    const response = await fetch(
      `${this.legacyBaseUrl}/${menuId}/categories/${categoryId}/items${query ? `?${query}` : ""}`,
      {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(item),
      },
    )

    return handleResponse<IMenuItem>(response)
  }

  static async updateMenuItem(
    menuId: string,
    categoryId: string,
    itemId: string,
    item: Partial<IMenuItem>,
    menuType?: MenuType,
  ): Promise<IMenuItem> {
    const params = new URLSearchParams()
    if (menuType) {
      params.set("menuType", menuType)
    }
    const query = params.toString()
    const response = await fetch(
      `${this.legacyBaseUrl}/${menuId}/categories/${categoryId}/items/${itemId}${query ? `?${query}` : ""}`,
      {
      method: "PUT",
      headers: this.buildHeaders(),
      body: JSON.stringify(item),
      },
    )

    return handleResponse<IMenuItem>(response)
  }

  static async deleteMenuItem(
    menuId: string,
    categoryId: string,
    itemId: string,
    menuType?: MenuType,
  ): Promise<void> {
    const params = new URLSearchParams()
    if (menuType) {
      params.set("menuType", menuType)
    }
    const query = params.toString()
    const response = await fetch(
      `${this.legacyBaseUrl}/${menuId}/categories/${categoryId}/items/${itemId}${query ? `?${query}` : ""}`,
      {
      method: "DELETE",
      headers: this.buildHeaders(),
      },
    )

    await handleResponse<void>(response)
  }

  static async saveMenuOrder(
    restaurantslug: string,
    categories: ICategory[],
    menuType: MenuType,
  ): Promise<{ ok: boolean }> {
    const response = await fetch(
      `${this.dashboardBaseUrl}/${encodeURIComponent(restaurantslug)}/menu?menuType=${menuType}`,
      {
      method: "PUT",
      headers: this.buildHeaders(),
      body: JSON.stringify({ categories }),
      },
    )

    return handleResponse<{ ok: boolean }>(response)
  }

  static async importMenuItems(
    restaurantslug: string,
    menuType: MenuType,
  ): Promise<{ ok: boolean; imported: number }> {
    const response = await fetch(
      `${this.dashboardBaseUrl}/${encodeURIComponent(restaurantslug)}/menu?menuType=${menuType}`,
      {
      method: "POST",
      headers: this.buildHeaders(),
      },
    )

    return handleResponse<{ ok: boolean; imported: number }>(response)
  }
}
