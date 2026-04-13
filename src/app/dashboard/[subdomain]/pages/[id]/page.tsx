'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowUp, Code2, Copy, Loader2, Plus, Trash2 } from 'lucide-react'

import { BuilderDesigner, type BuilderSectionState } from '@/components/builder-designer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { PageService } from '@/lib/page-service'
import type { BuilderSection, PageApiPayload, PageMetadata, ISEO } from '@/types/page'

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
  props: Record<string, any>
  propsJson: string
}

type BuilderSectionFormState = BuilderSection & {
  layoutInput: string
  elementsInput: string
  layoutError?: string
  elementsError?: string
}

type BuilderElement = {
  id?: string
  type?: string
  position?: number
  role?: string
  children?: BuilderElement[]
  columns?: BuilderColumn[]
  [key: string]: any
}

type BuilderColumn = {
  id?: string
  position?: number
  width?: string
  align?: string
  justify?: string
  children?: BuilderElement[]
  [key: string]: any
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

const randomId = () =>
  typeof globalThis !== 'undefined' &&
  typeof globalThis.crypto !== 'undefined' &&
  typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const normalizeBuilderJson = (value: unknown): unknown => {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map((item) => normalizeBuilderJson(item))
  if (value instanceof Map) {
    return Array.from(value.entries()).reduce<Record<string, unknown>>((acc, [key, val]) => {
      acc[String(key)] = normalizeBuilderJson(val)
      return acc
    }, {})
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, val]) => {
        acc[key] = normalizeBuilderJson(val)
        return acc
      },
      {},
    )
  }
  return value
}

const toJsonInput = (value: unknown, fallback: unknown = undefined) => {
  const normalized = normalizeBuilderJson(value)
  if (normalized === undefined || normalized === null) {
    if (fallback === undefined) return ''
    return JSON.stringify(fallback, null, 2)
  }
  return JSON.stringify(normalized, null, 2)
}

const formatPropsJson = (value: Record<string, any>) => toJsonInput(value, {})

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
  props: {
    title: "New block",
    content: "Update component props",
  },
  propsJson: '{\n  "title": "New block",\n  "content": "Update component props"\n}',
})

const createDefaultBuilderSection = (position: number): BuilderSectionFormState => {
  const generatedId = randomId()
  const layout = {
    container: 'xl',
    paddingY: '3rem',
    paddingX: '1.5rem',
  }

  const elements: BuilderSection['elements'] = []

  return {
    id: generatedId,
    key: `section-${position}`,
    type: 'hero',
    position,
    layout,
    elements,
    layoutInput: toJsonInput(layout, {}),
    elementsInput: toJsonInput(elements, []),
  }
}

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

const BLOCK_TYPE_OPTIONS = [
  'hero',
  'text',
  'image',
  'story',
  'menuGrid',
  'testimonials',
  'branchesContact',
  'branches',
  'categoriesStrip',
  'menuTeaser',
  'features',
  'deliveryInfo',
  'cta',
  'chefSection',
  'timeline',
  'mapSection',
  'socialProof',
  'footer',
  'custom-component',
]

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
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const rawSubdomain = useMemo(() => {
    const sub = params?.subdomain
    return Array.isArray(sub) ? sub[0] : sub
  }, [params])

  const rawId = useMemo(() => {
    const identifier = params?.id
    return Array.isArray(identifier) ? identifier[0] : identifier
  }, [params])

  const slugParam = searchParams?.get('slug')?.trim() ?? ''
  const languageParamRaw = searchParams?.get('language')?.trim() ?? ''
  const normalizedLanguage = languageParamRaw.toLowerCase()
  const resolvedLanguage =
    normalizedLanguage === 'en' || normalizedLanguage === 'ar'
      ? (normalizedLanguage as PageFormState['language'])
      : null
  const slugLookup = useMemo(() => {
    if (!slugParam || !resolvedLanguage) return null
    return { slug: slugParam, language: resolvedLanguage }
  }, [slugParam, resolvedLanguage])
  const slugParamsMissing = Boolean((slugParam || rawId === 'slug') && !slugLookup)

  const isCreateMode = (!rawId || rawId === 'create') && !slugLookup
  const dashboardPath = rawSubdomain ? `/dashboard/${rawSubdomain}/pages` : '/dashboard/pages'

  const [formState, setFormState] = useState<PageFormState>(createDefaultFormState)
  const [components, setComponents] = useState<ComponentFormState[]>([])
  const [builderSections, setBuilderSections] = useState<BuilderSectionFormState[]>([])
  const [keywordsInput, setKeywordsInput] = useState(DEFAULT_SEO.keywords.join(', '))
  const [structuredDataInput, setStructuredDataInput] = useState(
    JSON.stringify(DEFAULT_STRUCTURED_DATA, null, 2),
  )
  const [isLoading, setIsLoading] = useState(!isCreateMode)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const setBuilderSectionsFromDesigner = useCallback(
    (updater: (prev: BuilderSectionFormState[]) => BuilderSectionFormState[]) => {
      setBuilderSections((prev) => normalizeSectionsForDesigner(updater(prev)))
    },
    [],
  )

  const handleDesignerSectionsChange = useCallback(
    (updater: (prev: BuilderSectionState[]) => BuilderSectionState[]) => {
      setBuilderSections((prev) =>
        normalizeSectionsForDesigner(updater(prev).map((section) => ({
          ...section,
          layoutInput: toJsonInput(section.layout ?? {}, {}),
          elementsInput: toJsonInput(section.elements ?? [], []),
          layoutError: undefined,
          elementsError: undefined,
        }))),
      )
    },
    [],
  )

  useEffect(() => {
    if (!rawSubdomain) {
      setError('Missing restaurant context')
      setIsLoading(false)
      return
    }

    if (slugParamsMissing) {
      setError('Slug and language query parameters are required to edit this page.')
      setIsLoading(false)
      return
    }

    if (isCreateMode) {
      setIsLoading(false)
      return
    }

    if (!slugLookup && !rawId) {
      setError('Page identifier is missing.')
      setIsLoading(false)
      return
    }

    const pageId = slugLookup ? null : rawId
    if (!slugLookup && (!pageId || pageId === 'slug')) {
      setError('Invalid page identifier.')
      setIsLoading(false)
      return
    }

    let isMounted = true

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const page = slugLookup
          ? await PageService.getPageBySlug(rawSubdomain, slugLookup.slug, slugLookup.language)
          : await PageService.getPage(rawSubdomain, pageId as string)
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
          sortedComponents.map((component, idx) => {
            const props =
              component.props && typeof component.props === 'object' && !Array.isArray(component.props)
                ? (component.props as Record<string, any>)
                : {}
            return {
              component_id: component.component_id,
              type: component.type,
              position: idx + 1,
              props,
              propsJson: formatPropsJson(props),
            }
          }),
        )
        const normalizedSections: BuilderSectionFormState[] = Array.isArray(page.sections)
          ? page.sections.map((section, idx) => {
              const normalizedLayout = normalizeBuilderJson(section.layout)
              const normalizedElements = normalizeBuilderJson(section.elements)
              return {
                ...section,
                layout: normalizedLayout as BuilderSection['layout'],
                elements: normalizedElements as BuilderSection['elements'],
                position: section.position ?? idx + 1,
                layoutInput: toJsonInput(normalizedLayout, {}),
                elementsInput: toJsonInput(normalizedElements, []),
              }
            })
          : []
        setBuilderSections(normalizedSections)

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
  }, [isCreateMode, rawId, rawSubdomain, slugLookup, slugParamsMissing])

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

  const updateComponentAt = (
    index: number,
    updater: (component: ComponentFormState) => ComponentFormState,
  ) => {
    setComponents((prev) => prev.map((component, idx) => (idx === index ? updater(component) : component)))
  }

  const reindexComponents = (list: ComponentFormState[]) =>
    list.map((component, idx) => ({ ...component, position: idx + 1 }))

const reindexBuilderSections = (list: BuilderSectionFormState[]) =>
  list.map((section, idx) => ({ ...section, position: idx + 1 }))

const normalizeSectionsForDesigner = (sections: BuilderSectionFormState[]) =>
  sections.map((section, idx) => ({
    ...section,
    position: idx + 1,
    layoutInput: toJsonInput(section.layout ?? {}, {}),
    elementsInput: toJsonInput(section.elements ?? [], []),
    layoutError: undefined,
    elementsError: undefined,
  }))

const handleAddBuilderSection = () => {
  setBuilderSections((prev) => reindexBuilderSections([...prev, createDefaultBuilderSection(prev.length + 1)]))
}

  const handleRemoveBuilderSection = (index: number) => {
    setBuilderSections((prev) => reindexBuilderSections(prev.filter((_, idx) => idx !== index)))
  }

  const moveBuilderSection = (from: number, to: number) => {
    setBuilderSections((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [section] = next.splice(from, 1)
      next.splice(to, 0, section)
      return reindexBuilderSections(next)
    })
  }

  const duplicateBuilderSection = (index: number) => {
    setBuilderSections((prev) => {
      const target = prev[index]
      if (!target) return prev
      const clonedLayout = target.layout ? JSON.parse(JSON.stringify(target.layout)) : undefined
      const clonedElements = target.elements ? JSON.parse(JSON.stringify(target.elements)) : undefined
      const clone = {
        ...target,
        id: randomId(),
        key: `${target.key || target.id || 'section'}-copy`,
        layout: clonedLayout,
        elements: clonedElements,
        layoutInput: target.layoutInput,
        elementsInput: target.elementsInput,
        layoutError: undefined,
        elementsError: undefined,
        position: (target.position ?? index + 1) + 0.1,
      }
      const next = [...prev]
      next.splice(index + 1, 0, clone)
      return reindexBuilderSections(next)
    })
  }

  const handleBuilderSectionFieldChange = <K extends keyof BuilderSectionFormState>(
    index: number,
    field: K,
    value: BuilderSectionFormState[K],
  ) => {
    setBuilderSections((prev) =>
      prev.map((section, idx) => (idx === index ? { ...section, [field]: value } : section)),
    )
  }

  const handleBuilderSectionJsonChange = (
    index: number,
    field: 'layout' | 'elements',
    value: string,
  ) => {
    setBuilderSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== index) return section
        const next = { ...section }
        const inputKey = field === 'layout' ? 'layoutInput' : 'elementsInput'
        const errorKey = field === 'layout' ? 'layoutError' : 'elementsError'
        next[inputKey] = value
        if (!value.trim()) {
          next[field] = field === 'layout' ? undefined : []
          next[errorKey] = undefined
          return next
        }
        try {
          const parsed = JSON.parse(value)
          next[field] = parsed
          next[errorKey] = undefined
        } catch (_err) {
          next[errorKey] = 'Invalid JSON'
        }
        return next
      }),
    )
  }

  const formatBuilderSectionJson = (
    index: number,
    field: 'layout' | 'elements',
  ) => {
    setBuilderSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== index) return section
        const inputKey = field === 'layout' ? 'layoutInput' : 'elementsInput'
        const errorKey = field === 'layout' ? 'layoutError' : 'elementsError'
        const currentInput = section[inputKey]
        if (!currentInput?.trim()) {
          toast({ title: 'Nothing to format', description: 'Field is empty.', variant: 'destructive' })
          return section
        }
        try {
          const parsed = JSON.parse(currentInput)
          const formatted = JSON.stringify(parsed, null, 2)
          return {
            ...section,
            [field]: parsed,
            [inputKey]: formatted,
            [errorKey]: undefined,
          }
        } catch (err) {
          toast({
            title: 'Invalid JSON',
            description: err instanceof Error ? err.message : 'Unable to parse JSON',
            variant: 'destructive',
          })
          return {
            ...section,
            [errorKey]: 'Invalid JSON',
          }
        }
      }),
    )
  }

  const handleComponentFieldChange = (index: number, field: 'component_id' | 'type', value: string) => {
    updateComponentAt(index, (component) => ({
      ...component,
      [field]: value,
    }))
  }

  const handlePropsJsonChange = (index: number, value: string) => {
    updateComponentAt(index, (component) => ({
      ...component,
      propsJson: value,
    }))
  }

  const handlePropsJsonApply = (index: number) => {
    let parseErrorMessage: string | null = null

    setComponents((prev) => {
      const next = [...prev]
      const target = next[index]
      if (!target) return prev

      try {
        const parsed = target.propsJson.trim() ? (JSON.parse(target.propsJson) as Record<string, any>) : {}
        next[index] = {
          ...target,
          props: parsed,
          propsJson: formatPropsJson(parsed),
        }
        return next
      } catch (error) {
        parseErrorMessage = error instanceof Error ? error.message : 'Invalid JSON'
        return prev
      }
    })

    if (parseErrorMessage) {
      toast({
        title: 'Invalid JSON',
        description: parseErrorMessage,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Props updated', description: 'Block props synced from JSON.' })
    }
  }

  const handlePrimitivePropChange = (
    index: number,
    key: string,
    value: string | number | boolean,
  ) => {
    updateComponentAt(index, (component) => {
      const nextProps = { ...(component.props ?? {}), [key]: value }
      return { ...component, props: nextProps, propsJson: formatPropsJson(nextProps) }
    })
  }

  const handlePrimitivePropRemove = (index: number, key: string) => {
    updateComponentAt(index, (component) => {
      const { [key]: _removed, ...rest } = component.props ?? {}
      return { ...component, props: rest, propsJson: formatPropsJson(rest) }
    })
  }

  const handleAddPrimitiveProp = (
    index: number,
    key: string,
    value: string | number | boolean,
  ) => {
    if (!key.trim()) {
      toast({ title: 'Property name required', variant: 'destructive' })
      return
    }
    updateComponentAt(index, (component) => {
      const nextProps = { ...(component.props ?? {}), [key]: value }
      return { ...component, props: nextProps, propsJson: formatPropsJson(nextProps) }
    })
  }

  const moveComponent = (from: number, to: number) => {
    setComponents((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return reindexComponents(next)
    })
  }

  const duplicateComponent = (index: number) => {
    setComponents((prev) => {
      const target = prev[index]
      if (!target) return prev
      const cloneProps = JSON.parse(JSON.stringify(target.props ?? {}))
      const clone: ComponentFormState = {
        ...target,
        component_id: `${target.component_id}-copy-${randomId()}`,
        props: cloneProps,
        propsJson: formatPropsJson(cloneProps),
      }
      const next = [...prev]
      next.splice(index + 1, 0, clone)
      return reindexComponents(next)
    })
    toast({ title: 'Block duplicated' })
  }

  const handleAddComponent = () => {
    setComponents((prev) => reindexComponents([...prev, createDefaultComponent(prev.length + 1)]))
  }

  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => reindexComponents(prev.filter((_, idx) => idx !== index)))
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

    const parsedComponents: PageApiPayload['components'] = components.map((component, index) => ({
      component_id: component.component_id || `component-${index + 1}`,
      type: component.type || 'custom-component',
      position: component.position || index + 1,
      props: component.props ?? {},
    }))

    const keywords = keywordsInput
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    const hasBuilderJsonErrors = builderSections.some(
      (section) => Boolean(section.layoutError) || Boolean(section.elementsError),
    )
    if (hasBuilderJsonErrors) {
      setIsSaving(false)
      setError('Fix JSON errors inside builder sections before saving.')
      return
    }

    const sanitizedSections =
      builderSections.length > 0
        ? builderSections.map(({ layoutInput, elementsInput, layoutError, elementsError, ...section }) => ({
            ...section,
          }))
        : undefined

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
      sections: sanitizedSections,
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

  const builderSectionsCount = builderSections.length

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 lg:px-0">
        <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 text-white shadow-2xl shadow-indigo-200/40">
          <div className="flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-3">
              <Badge className="w-fit rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                Pages · Builder
              </Badge>
              <div>
                <h1 className="text-2xl font-semibold sm:text-3xl">
                  {isCreateMode ? 'Create a new storytelling page' : `Editing ${formState.name || 'page'}`}
                </h1>
                <p className="text-sm text-white/80 sm:text-base">
                  Craft high-converting landing pages with consistent structure, rich media, and localized SEO.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-medium">
              <Badge className="rounded-full bg-white/15 px-4 py-1 text-white/90">Slug · /{formState.slug || 'new-page'}</Badge>
              <Badge className="rounded-full bg-white/15 px-4 py-1 text-white/90">Language · {formState.language?.toUpperCase()}</Badge>
              <Badge
                className={`rounded-full px-4 py-1 ${
                  formState.isPublished ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-200/40' : 'bg-amber-400/20 text-amber-100 border border-amber-200/40'
                }`}
              >
                {formState.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20"
                onClick={() => router.push(dashboardPath)}
              >
                Back to pages
              </Button>
              <Button
                type="button"
                className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90"
                onClick={() =>
                  (document.getElementById('page-editor-form') as HTMLFormElement | null)?.requestSubmit()
                }
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-600" />
                    Saving…
                  </>
                ) : (
                  'Save page'
                )}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl border border-red-200 bg-white/90 shadow">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form id="page-editor-form" onSubmit={handleSubmit} className="space-y-8">
          <Card className="rounded-3xl border border-slate-100/80 bg-white/95 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100/60">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold text-slate-900">Basic information</CardTitle>
              <p className="text-sm text-slate-500">Name, slug, and publishing attributes for this page.</p>
            </CardHeader>
            <CardContent className="space-y-5">
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

          <Card className="rounded-3xl border border-slate-100/80 bg-white/95 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">SEO settings</CardTitle>
            <p className="text-sm text-slate-500">Structured metadata that powers discoverability and sharing.</p>
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

        <Card className="rounded-3xl border border-violet-100/80 bg-white/95 shadow-lg shadow-violet-200/40 ring-1 ring-violet-100/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">Builder sections</CardTitle>
            <p className="text-sm text-slate-500">
              Drag sections, columns, and widgets like Elementor or dive into the JSON for precise control.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue={builderSectionsCount > 0 ? "canvas" : "json"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="canvas">Visual builder</TabsTrigger>
                <TabsTrigger value="json">Raw JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="canvas" className="mt-6">
                <BuilderDesigner sections={builderSections} onSectionsChange={handleDesignerSectionsChange} />
              </TabsContent>
              <TabsContent value="json" className="mt-6 space-y-6">
                {builderSectionsCount > 0 && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                    <AlertDescription>
                      This page currently uses {builderSectionsCount} Builder section{builderSectionsCount > 1 ? 's' : ''}. Edit them visually or tweak the JSON below.
                    </AlertDescription>
                  </Alert>
                )}
                {builderSections.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    No builder sections yet. Add one below to start designing with the new builder.
                  </div>
                )}
                {builderSections.map((section, index) => (
                  <Card
                    key={section.id ?? `${section.key}-${index}`}
                    className="rounded-2xl border border-slate-200/70 bg-white shadow-md shadow-slate-200/60"
                  >
                    <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold text-slate-900">
                          Section {index + 1} · <span className="uppercase text-violet-600">{section.type || "unknown"}</span>
                        </CardTitle>
                        <p className="text-xs text-slate-500">Position {section.position ?? index + 1}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === 0}
                          onClick={() => moveBuilderSection(index, index - 1)}
                          aria-label="Move builder section up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === builderSections.length - 1}
                          onClick={() => moveBuilderSection(index, index + 1)}
                          aria-label="Move builder section down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => duplicateBuilderSection(index)}
                          aria-label="Duplicate builder section"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRemoveBuilderSection(index)}
                          aria-label={`Remove builder section ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-slate-600" htmlFor={`builder-section-id-${index}`}>
                            Section ID
                          </label>
                          <Input
                            id={`builder-section-id-${index}`}
                            value={section.id ?? ""}
                            onChange={(event) => handleBuilderSectionFieldChange(index, "id", event.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600" htmlFor={`builder-section-key-${index}`}>
                            Section key
                          </label>
                          <Input
                            id={`builder-section-key-${index}`}
                            value={section.key ?? ""}
                            onChange={(event) => handleBuilderSectionFieldChange(index, "key", event.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600" htmlFor={`builder-section-type-${index}`}>
                            Section type
                          </label>
                          <Input
                            id={`builder-section-type-${index}`}
                            value={section.type ?? ""}
                            onChange={(event) => handleBuilderSectionFieldChange(index, "type", event.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600" htmlFor={`builder-section-position-${index}`}>
                            Position
                          </label>
                          <Input
                            id={`builder-section-position-${index}`}
                            type="number"
                            value={section.position ?? index + 1}
                            onChange={(event) =>
                              handleBuilderSectionFieldChange(index, "position", Number(event.target.value) || index + 1)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-600" htmlFor={`builder-section-layout-${index}`}>
                            Layout JSON
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full px-3 text-xs text-slate-500 hover:text-slate-900"
                            onClick={() => formatBuilderSectionJson(index, "layout")}
                          >
                            <Code2 className="mr-1 h-3.5 w-3.5" />
                            Format
                          </Button>
                        </div>
                        <Textarea
                          id={`builder-section-layout-${index}`}
                          value={section.layoutInput}
                          onChange={(event) => handleBuilderSectionJsonChange(index, "layout", event.target.value)}
                          className="font-mono text-xs"
                          rows={6}
                        />
                        {section.layoutError && (
                          <p className="pt-1 text-xs text-red-600">{section.layoutError}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-600" htmlFor={`builder-section-elements-${index}`}>
                            Elements JSON
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full px-3 text-xs text-slate-500 hover:text-slate-900"
                            onClick={() => formatBuilderSectionJson(index, "elements")}
                          >
                            <Code2 className="mr-1 h-3.5 w-3.5" />
                            Format
                          </Button>
                        </div>
                        <Textarea
                          id={`builder-section-elements-${index}`}
                          value={section.elementsInput}
                          onChange={(event) => handleBuilderSectionJsonChange(index, "elements", event.target.value)}
                          className="font-mono text-xs"
                          rows={8}
                        />
                        {section.elementsError && (
                          <p className="pt-1 text-xs text-red-600">{section.elementsError}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="rounded-full px-4" onClick={handleAddBuilderSection}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add builder section
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-100/80 bg-white/95 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">Page components</CardTitle>
            <p className="text-sm text-slate-500">Assemble the experience using drag-friendly blocks and JSON props.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {builderSectionsCount > 0 && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                <AlertDescription>
                  This page currently uses {builderSectionsCount} Builder section{builderSectionsCount > 1 ? 's' : ''}. Edit them from the Builder UI;
                  saving here keeps the sections untouched.
                </AlertDescription>
              </Alert>
            )}
            {components.length === 0 && builderSectionsCount === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No components yet. Start by adding layout blocks below.
              </div>
            )}
            {components.length === 0 && builderSectionsCount > 0 && (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center text-sm text-amber-900">
                Classic components are hidden because this page is fully managed by Builder sections.
              </div>
            )}
            {components.map((component, index) => (
              <Card
                key={`${component.component_id}-${index}`}
                className="rounded-2xl border border-slate-200/70 bg-white shadow-md shadow-slate-200/60"
              >
                <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      Block {index + 1} · <span className="uppercase text-blue-600">{component.type}</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500">Position {component.position}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => moveComponent(index, index - 1)}
                      aria-label="Move block up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === components.length - 1}
                      onClick={() => moveComponent(index, index + 1)}
                      aria-label="Move block down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateComponent(index)}
                      aria-label="Duplicate block"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
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
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                        list="block-type-options"
                        value={component.type}
                        onChange={(event) =>
                          handleComponentFieldChange(index, 'type', event.target.value)
                        }
                        placeholder="hero, gallery, rich-text"
                      />
                    </div>
                  </div>

                  <ComponentPropsEditor
                    component={component}
                    onPrimitiveChange={(key, value) => handlePrimitivePropChange(index, key, value)}
                    onPrimitiveRemove={(key) => handlePrimitivePropRemove(index, key)}
                    onAddPrimitive={(key, value) => handleAddPrimitiveProp(index, key, value)}
                    onPropsJsonChange={(value) => handlePropsJsonChange(index, value)}
                    onPropsJsonApply={() => handlePropsJsonApply(index)}
                  />
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-dashed border-slate-300 py-3 text-slate-600 hover:border-slate-400 hover:text-slate-800"
              onClick={handleAddComponent}
            >
              <Plus className="h-4 w-4" />
              Add component
            </Button>
            <datalist id="block-type-options">
              {BLOCK_TYPE_OPTIONS.map((option) => (
                <option value={option} key={option} />
              ))}
            </datalist>
          </CardContent>
        </Card>

        {!isCreateMode && (
          <Card className="rounded-3xl border border-slate-100/80 bg-white/95 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100/60">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold text-slate-900">Metadata</CardTitle>
              <p className="text-sm text-slate-500">Timestamps update automatically when you publish or edit.</p>
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

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-slate-300 px-5"
            onClick={() => router.push(dashboardPath)}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-full px-6" disabled={isSaving}>
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
    </div>
  </main>
  )
}

type PrimitiveValue = string | number | boolean

const isPrimitiveValue = (value: unknown): value is PrimitiveValue =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

type ComponentPropsEditorProps = {
  component: ComponentFormState
  onPrimitiveChange: (key: string, value: PrimitiveValue) => void
  onPrimitiveRemove: (key: string) => void
  onAddPrimitive: (key: string, value: PrimitiveValue) => void
  onPropsJsonChange: (value: string) => void
  onPropsJsonApply: () => void
}

const ComponentPropsEditor = ({
  component,
  onPrimitiveChange,
  onPrimitiveRemove,
  onAddPrimitive,
  onPropsJsonChange,
  onPropsJsonApply,
}: ComponentPropsEditorProps) => {
  const primitiveEntries = Object.entries(component.props ?? {}).filter(([, value]) =>
    isPrimitiveValue(value),
  )
  const complexEntries = Object.entries(component.props ?? {}).filter(
    ([, value]) => !isPrimitiveValue(value),
  )

  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newType, setNewType] = useState<'string' | 'number' | 'boolean'>('string')
  const [newBoolean, setNewBoolean] = useState(true)

  const handleAddField = () => {
    if (!newKey.trim()) return
    let value: PrimitiveValue
    if (newType === 'boolean') {
      value = newBoolean
    } else if (newType === 'number') {
      value = Number(newValue) || 0
    } else {
      value = newValue
    }
    onAddPrimitive(newKey.trim(), value)
    setNewKey('')
    setNewValue('')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600">Quick fields</p>
          <p className="text-xs text-slate-400">Edit primitive fields directly</p>
        </div>
        <div className="mt-4 space-y-3">
          {primitiveEntries.length === 0 && (
            <p className="text-xs text-slate-500">No primitive props detected.</p>
          )}
          {primitiveEntries.map(([key, value]) => {
            const valueType = typeof value
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-medium text-slate-500">{key}</p>
                  {valueType === 'boolean' ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={Boolean(value)}
                        onCheckedChange={(checked) => onPrimitiveChange(key, checked)}
                      />
                      <span className="text-xs text-slate-500">{checkedLabel(Boolean(value))}</span>
                    </div>
                  ) : (
                    <Input
                      type={valueType === 'number' ? 'number' : 'text'}
                      value={valueType === 'number' ? String(value ?? 0) : String(value ?? '')}
                      onChange={(event) =>
                        onPrimitiveChange(
                          key,
                          valueType === 'number' ? Number(event.target.value) : event.target.value,
                        )
                      }
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => onPrimitiveRemove(key)}
                  aria-label={`Remove ${key}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600">Add property</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="Property name"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
            />
            <Select value={newType} onValueChange={(value) => setNewType(value as 'string' | 'number' | 'boolean')}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
            {newType === 'boolean' ? (
              <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                <Switch checked={newBoolean} onCheckedChange={(checked) => setNewBoolean(checked)} />
              </div>
            ) : (
              <Input
                type={newType === 'number' ? 'number' : 'text'}
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder={newType === 'number' ? '0' : 'Value'}
              />
            )}
          </div>
          <Button type="button" variant="outline" className="mt-3 w-full rounded-full" onClick={handleAddField}>
            Add property
          </Button>
        </div>
      </div>

      {complexEntries.length > 0 && (
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5">
          <p className="text-sm font-medium text-slate-600">Nested data</p>
          <p className="text-xs text-slate-500">Use the JSON editor below to modify complex props.</p>
          <div className="mt-3 space-y-2">
            {complexEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-white/60 bg-white/80 p-3 shadow-inner">
                <p className="text-xs font-semibold text-slate-600">{key}</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-inner">
        <label className="text-xs font-medium text-slate-600">Advanced props editor (JSON)</label>
        <Textarea
          value={component.propsJson}
          onChange={(event) => onPropsJsonChange(event.target.value)}
          rows={8}
          className="rounded-2xl border-slate-200/70 font-mono text-xs"
        />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="rounded-full px-4" onClick={onPropsJsonApply}>
            Sync from JSON
          </Button>
          <p className="text-xs text-slate-500">Applies the JSON above to this block.</p>
        </div>
      </div>
    </div>
  )
}

const checkedLabel = (value: boolean) => (value ? 'Enabled' : 'Disabled')
