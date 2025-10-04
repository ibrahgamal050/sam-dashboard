'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { PageService } from '@/lib/page-service'
import type { PageApiPayload, PageMetadata, ISEO } from '@/types/page'

const DEFAULT_STRUCTURED_DATA: ISEO['structured_data'] = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'New Page',
  url: 'https://example.com',
  image: '/placeholder.svg?height=400&width=800',
  hasMenu: {
    '@type': 'Menu',
    name: 'Menu',
    description: 'Describe your menu here',
    hasMenuSection: [],
  },
}

type SeoFormState = Omit<ISEO, 'keywords' | 'structured_data'> & {
  keywords: string[]
  structured_data: ISEO['structured_data']
}

const DEFAULT_SEO: SeoFormState = {
  title: 'New Page Title',
  description: 'Add a concise description for this page.',
  keywords: ['restaurant', 'page'],
  og_title: 'New Page Title',
  og_description: 'Add a concise description for this page.',
  og_image: '/placeholder.svg?height=400&width=800',
  og_type: 'website' as const,
  twitter_card: 'summary' as const,
  twitter_title: 'New Page Title',
  twitter_description: 'Add a concise description for this page.',
  twitter_image: '/placeholder.svg?height=400&width=800',
  canonical_url: 'https://example.com',
  structured_data: DEFAULT_STRUCTURED_DATA,
}

type ComponentFormState = {
  component_id: string
  type: string
  position: number
  props: string
}

type PageFormState = {
  _id?: string
  name: string
  slug: string
  language: 'en' | 'ar'
  template: boolean
  isPublished: boolean
  headerImage: string
  seo: SeoFormState
  metadata: Partial<PageMetadata>
}

const createDefaultComponent = (position: number): ComponentFormState => ({
  component_id: `component-${
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : Date.now().toString()
  }`,
  type: 'custom-component',
  position,
  props: '{\n  "title": "New block",\n  "content": "Update component props"\n}',
})

const createDefaultFormState = (): PageFormState => ({
  name: 'New Page',
  slug: 'new-page',
  language: 'en',
  template: false,
  isPublished: false,
  headerImage: '/placeholder.svg?height=400&width=800',
  seo: {
    ...DEFAULT_SEO,
    keywords: [...DEFAULT_SEO.keywords],
    structured_data: JSON.parse(JSON.stringify(DEFAULT_STRUCTURED_DATA)) as ISEO['structured_data'],
  },
  metadata: {},
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

export default function PageEditor() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const rawSubdomain = useMemo(() => {
    const sub = params?.subdomain
    return Array.isArray(sub) ? sub[0] : sub
  }, [params])

  const rawId = useMemo(() => {
    const identifier = params?.id
    return Array.isArray(identifier) ? identifier[0] : identifier
  }, [params])

  const isCreateMode = !rawId || rawId === 'create'
  const dashboardPath = rawSubdomain ? `/dashboard/${rawSubdomain}/pages` : '/dashboard/pages'

  const [formState, setFormState] = useState<PageFormState>(createDefaultFormState)
  const [components, setComponents] = useState<ComponentFormState[]>([])
  const [keywordsInput, setKeywordsInput] = useState(DEFAULT_SEO.keywords.join(', '))
  const [structuredDataInput, setStructuredDataInput] = useState(
    JSON.stringify(DEFAULT_STRUCTURED_DATA, null, 2),
  )
  const [isLoading, setIsLoading] = useState(!isCreateMode)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  useEffect(() => {
    if (!rawSubdomain || isCreateMode || !rawId) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const page = await PageService.getPage(rawSubdomain, rawId)
        if (!isMounted) return

        const sortedComponents = [...(page.components ?? [])].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0),
        )

        setFormState({
          _id: page._id,
          name: page.name,
          slug: page.slug,
          language: page.language,
          template: page.template ?? false,
          isPublished: page.isPublished ?? false,
          headerImage: page.headerImage ?? '/placeholder.svg?height=400&width=800',
          seo: {
            ...page.seo,
            keywords: [...(page.seo.keywords ?? [])],
            structured_data: JSON.parse(
              JSON.stringify(page.seo.structured_data ?? DEFAULT_STRUCTURED_DATA),
            ) as ISEO['structured_data'],
          },
          metadata: page.metadata ?? {},
        })

        setComponents(
          sortedComponents.map((component) => ({
            component_id: component.component_id,
            type: component.type,
            position: component.position ?? 1,
            props: JSON.stringify(component.props ?? {}, null, 2),
          })),
        )

        setKeywordsInput(page.seo.keywords?.join(', ') ?? '')
        setStructuredDataInput(
          JSON.stringify(page.seo.structured_data ?? DEFAULT_STRUCTURED_DATA, null, 2),
        )
        setSlugManuallyEdited(true)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load page data')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [isCreateMode, rawId, rawSubdomain])

  const handleNameChange = (value: string) => {
    setFormState((prev) => {
      const next = { ...prev, name: value }
      if (!slugManuallyEdited) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setFormState((prev) => ({ ...prev, slug: slugify(value) }))
  }

  const handleHeaderImageChange = (value: string) => {
    setFormState((prev) => ({ ...prev, headerImage: value }))
  }

  const handleSeoChange = <K extends keyof SeoFormState>(field: K, value: SeoFormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value,
      },
    }))
  }

  const handleComponentFieldChange = (
    index: number,
    field: keyof ComponentFormState,
    value: string,
  ) => {
    setComponents((prev) =>
      prev.map((component, idx) =>
        idx === index
          ? {
              ...component,
              [field]: field === 'position' ? Number(value) || 0 : value,
            }
          : component,
      ),
    )
  }

  const handleAddComponent = () => {
    setComponents((prev) => [...prev, createDefaultComponent(prev.length + 1)])
  }

  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rawSubdomain) return

    setIsSaving(true)
    setError(null)

    let structuredData: ISEO['structured_data'] = DEFAULT_STRUCTURED_DATA

    try {
      structuredData = structuredDataInput.trim()
        ? (JSON.parse(structuredDataInput) as ISEO['structured_data'])
        : DEFAULT_STRUCTURED_DATA
    } catch (err) {
      setIsSaving(false)
      setError('Structured data must be valid JSON')
      return
    }

    const parsedComponents: PageApiPayload['components'] = []

    for (let i = 0; i < components.length; i += 1) {
      const component = components[i]
      let props: Record<string, unknown> = {}

      if (component.props.trim()) {
        try {
          props = JSON.parse(component.props)
        } catch (err) {
          setIsSaving(false)
          setError(`Component ${i + 1} props must be valid JSON`)
          return
        }
      }

      parsedComponents.push({
        component_id: component.component_id || `component-${i + 1}`,
        type: component.type || 'custom-component',
        position: component.position || i + 1,
        props,
      })
    }

    const keywords = keywordsInput
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    const payload: PageApiPayload = {
      _id: formState._id,
      name: formState.name.trim(),
      slug: slugify(formState.slug),
      language: formState.language,
      template: formState.template,
      isPublished: formState.isPublished,
      headerImage: formState.headerImage.trim() || '/placeholder.svg?height=400&width=800',
      seo: {
        ...formState.seo,
        keywords,
        structured_data: structuredData,
      },
      components: parsedComponents,
      metadata: {
        created_at:
          formState.metadata?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: formState.isPublished
          ? formState.metadata?.published_at ?? new Date().toISOString()
          : undefined,
      },
    }

    try {
      await PageService.savePage(rawSubdomain, payload)
      toast({ title: 'Page saved', description: 'Your changes have been applied.' })
      router.push(dashboardPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save page')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
            {isCreateMode ? 'Create Page' : 'Edit Page'}
          </h1>
          <p className="text-sm text-slate-500">
            Configure content, SEO settings, and layout blocks for this page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(dashboardPath)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              (document.getElementById('page-editor-form') as HTMLFormElement | null)?.requestSubmit()
            }
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              'Save Page'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form id="page-editor-form" onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Basic information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="page-name">
                  Page name
                </label>
                <Input
                  id="page-name"
                  value={formState.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Homepage"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="page-slug">
                  Slug
                </label>
                <Input
                  id="page-slug"
                  value={formState.slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  placeholder="home"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Language</label>
                <Select
                  value={formState.language}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, language: value as 'en' | 'ar' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="page-header-image">
                  Header image URL
                </label>
                <Input
                  id="page-header-image"
                  value={formState.headerImage}
                  onChange={(event) => handleHeaderImageChange(event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">Template</p>
                  <p className="text-xs text-slate-500">Mark if this page should be treated as a reusable template.</p>
                </div>
                <Switch
                  checked={formState.template}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, template: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">Published</p>
                  <p className="text-xs text-slate-500">Control whether this page is publicly available.</p>
                </div>
                <Switch
                  checked={formState.isPublished}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, isPublished: checked }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">SEO settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="seo-title">
                  Meta title
                </label>
                <Input
                  id="seo-title"
                  value={formState.seo.title}
                  onChange={(event) => handleSeoChange('title', event.target.value)}
                  maxLength={60}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="seo-canonical">
                  Canonical URL
                </label>
                <Input
                  id="seo-canonical"
                  value={formState.seo.canonical_url}
                  onChange={(event) => handleSeoChange('canonical_url', event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="seo-description">
                Meta description
              </label>
              <Textarea
                id="seo-description"
                value={formState.seo.description}
                onChange={(event) => handleSeoChange('description', event.target.value)}
                maxLength={160}
                rows={3}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="seo-keywords">
                Keywords (comma separated)
              </label>
              <Input
                id="seo-keywords"
                value={keywordsInput}
                onChange={(event) => setKeywordsInput(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="seo-og-title">
                  Open Graph title
                </label>
                <Input
                  id="seo-og-title"
                  value={formState.seo.og_title}
                  onChange={(event) => handleSeoChange('og_title', event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="seo-og-description">
                  Open Graph description
                </label>
                <Input
                  id="seo-og-description"
                  value={formState.seo.og_description}
                  onChange={(event) => handleSeoChange('og_description', event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="seo-og-image">
                  Open Graph image URL
                </label>
                <Input
                  id="seo-og-image"
                  value={formState.seo.og_image}
                  onChange={(event) => handleSeoChange('og_image', event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Open Graph type</label>
                <Select
                  value={formState.seo.og_type}
                  onValueChange={(value) =>
                    handleSeoChange('og_type', value as SeoFormState['og_type'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Twitter card</label>
                <Select
                  value={formState.seo.twitter_card}
                  onValueChange={(value) =>
                    handleSeoChange('twitter_card', value as SeoFormState['twitter_card'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Summary large image</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="player">Player</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="seo-twitter-image">
                  Twitter image URL
                </label>
                <Input
                  id="seo-twitter-image"
                  value={formState.seo.twitter_image}
                  onChange={(event) => handleSeoChange('twitter_image', event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="seo-twitter-title">
                  Twitter title
                </label>
                <Input
                  id="seo-twitter-title"
                  value={formState.seo.twitter_title}
                  onChange={(event) => handleSeoChange('twitter_title', event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="seo-twitter-description">
                  Twitter description
                </label>
                <Input
                  id="seo-twitter-description"
                  value={formState.seo.twitter_description}
                  onChange={(event) => handleSeoChange('twitter_description', event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="seo-structured-data">
                Structured data (JSON-LD)
              </label>
              <Textarea
                id="seo-structured-data"
                value={structuredDataInput}
                onChange={(event) => setStructuredDataInput(event.target.value)}
                className="font-mono text-xs"
                rows={8}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Page components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {components.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No components yet. Start by adding layout blocks below.
              </div>
            )}
            {components.map((component, index) => (
              <Card key={`${component.component_id}-${index}`} className="border border-slate-200">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Component {index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleRemoveComponent(index)}
                    aria-label={`Remove component ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600" htmlFor={`component-id-${index}`}>
                        Component ID
                      </label>
                      <Input
                        id={`component-id-${index}`}
                        value={component.component_id}
                        onChange={(event) =>
                          handleComponentFieldChange(index, 'component_id', event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600" htmlFor={`component-type-${index}`}>
                        Component type
                      </label>
                      <Input
                        id={`component-type-${index}`}
                        value={component.type}
                        onChange={(event) =>
                          handleComponentFieldChange(index, 'type', event.target.value)
                        }
                        placeholder="hero, gallery, rich-text"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600" htmlFor={`component-position-${index}`}>
                        Position
                      </label>
                      <Input
                        id={`component-position-${index}`}
                        type="number"
                        min={1}
                        value={component.position}
                        onChange={(event) =>
                          handleComponentFieldChange(index, 'position', event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600" htmlFor={`component-props-${index}`}>
                      Props (JSON)
                    </label>
                    <Textarea
                      id={`component-props-${index}`}
                      value={component.props}
                      onChange={(event) =>
                        handleComponentFieldChange(index, 'props', event.target.value)
                      }
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" className="flex items-center gap-2" onClick={handleAddComponent}>
              <Plus className="h-4 w-4" />
              Add component
            </Button>
          </CardContent>
        </Card>

        {!isCreateMode && (
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</p>
                  <p className="text-sm text-slate-700">{formatDate(formState.metadata?.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Last updated</p>
                  <p className="text-sm text-slate-700">{formatDate(formState.metadata?.updated_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Published</p>
                  <p className="text-sm text-slate-700">
                    {formState.isPublished
                      ? formatDate(formState.metadata?.published_at)
                      : 'Draft'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(dashboardPath)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              'Save Page'
            )}
          </Button>
        </div>
      </form>
    </section>
  )
}
