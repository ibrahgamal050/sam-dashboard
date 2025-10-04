import type { PageApiPayload, PageDto } from '@/types/page'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const data = await response.json()
      if (typeof data?.error === 'string') {
        message = data.error
      } else if (typeof data?.message === 'string') {
        message = data.message
      }
    } catch (error) {
      // ignore parse errors
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

export class PageService {
  private static buildBasePath(subdomain: string) {
    return `/api/${subdomain}/pages`
  }

  static async getPage(subdomain: string, pageId: string): Promise<PageDto> {
    const response = await fetch(`${this.buildBasePath(subdomain)}/${pageId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const data = await handleResponse<{ success: boolean; data: PageDto }>(response)
    return data.data
  }

  static async savePage(subdomain: string, page: PageApiPayload): Promise<PageDto> {
    const response = await fetch(this.buildBasePath(subdomain), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pages: [page] }),
    })

    const data = await handleResponse<{
      success: boolean
      data: { pages: PageDto[] }
    }>(response)

    const savedPage = data.data.pages.find((p) => {
      if (page._id) {
        return p._id === page._id
      }
      return p.slug === page.slug && p.language === page.language
    })

    if (!savedPage) {
      throw new Error('Unable to confirm saved page')
    }

    return savedPage
  }
}
