import type { ICategory, IMenu, IMenuItem } from "@/types/menu"

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
    throw new Error(message)
  }

  return response.status === 204 ? (undefined as unknown as T) : ((await response.json()) as T)
}

export class MenuService {
  private static readonly baseUrl = "/api/menus"

  static async getMenu(menuId: string): Promise<IMenu> {
    const response = await fetch(`${this.baseUrl}/${menuId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    return handleResponse<IMenu>(response)
  }

  static async addCategory(menuId: string, category: Partial<ICategory>): Promise<ICategory> {
    const response = await fetch(`${this.baseUrl}/${menuId}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(category),
    })

    return handleResponse<ICategory>(response)
  }

  static async updateCategory(menuId: string, categoryId: string, category: Partial<ICategory>): Promise<ICategory> {
    const response = await fetch(`${this.baseUrl}/${menuId}/categories/${categoryId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(category),
    })

    return handleResponse<ICategory>(response)
  }

  static async deleteCategory(menuId: string, categoryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${menuId}/categories/${categoryId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    await handleResponse<void>(response)
  }

  static async addMenuItem(menuId: string, categoryId: string, item: Partial<IMenuItem>): Promise<IMenuItem> {
    const response = await fetch(`${this.baseUrl}/${menuId}/categories/${categoryId}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })

    return handleResponse<IMenuItem>(response)
  }

  static async updateMenuItem(menuId: string, categoryId: string, itemId: string, item: Partial<IMenuItem>): Promise<IMenuItem> {
    const response = await fetch(`${this.baseUrl}/${menuId}/categories/${categoryId}/items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })

    return handleResponse<IMenuItem>(response)
  }

  static async deleteMenuItem(menuId: string, categoryId: string, itemId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${menuId}/categories/${categoryId}/items/${itemId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    await handleResponse<void>(response)
  }

  static async saveMenu(menu: IMenu): Promise<IMenu> {
    if (!menu._id) {
      throw new Error("Menu id is required to save menu")
    }

    const response = await fetch(`${this.baseUrl}/${menu._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(menu),
    })

    return handleResponse<IMenu>(response)
  }
}
