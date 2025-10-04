export interface Component {
  id: string
  type: 'banner' | 'text-box' | 'row' | 'column' | 'text' | 'button' | 'image' | 'style'
  props?: {
    width?: string
    text?: string
    src?: string
    [key: string]: any
  }
  children?: Component[]
}

export interface ComponentType {
  type: Component['type']
  props?: Record<string, unknown>
}

export interface ComponentTreeProps {
  components: Component[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddComponent?: (preset: ComponentType) => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const createComponentFromPreset = (preset: ComponentType): Component => {
  const base: Component = {
    id: generateId(),
    type: preset.type,
    props: {},
    children: [],
  }

  switch (preset.type) {
    case 'text': {
      const variant = (preset.props?.variant as string) ?? 'paragraph'
      base.props = {
        variant,
        text:
          (preset.props?.text as string) ??
          (variant === 'heading' ? 'New Heading' : 'Paragraph text'),
        level: (preset.props?.level as string) ?? 'h2',
      }

      if (variant !== 'heading') {
        delete base.props.level
      }
      break
    }
    case 'image':
      base.props = {
        src: (preset.props?.src as string) ?? '/placeholder.svg',
        alt: (preset.props?.alt as string) ?? 'Image',
      }
      break
    case 'button':
      base.props = {
        text: (preset.props?.text as string) ?? 'Click me',
        variant: (preset.props?.variant as string) ?? 'default',
      }
      break
    case 'banner':
      base.props = {
        layout: {
          height: 450,
          ...((preset.props?.layout as Record<string, unknown>) ?? {}),
        },
        slide: {
          effect: 'none',
          ...((preset.props?.slide as Record<string, unknown>) ?? {}),
        },
        background: {
          color: '#1e3a8a',
          overlay: '#00000000',
          ...((preset.props?.background as Record<string, unknown>) ?? {}),
        },
        border: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          ...((preset.props?.border as Record<string, unknown>) ?? {}),
        },
        text: (preset.props?.text as string) ?? 'Banner heading',
      }
      break
    case 'row':
      base.props = preset.props ?? {}
      base.children = [
        {
          id: generateId(),
          type: 'column',
          props: { width: '6/12' },
          children: [],
        },
        {
          id: generateId(),
          type: 'column',
          props: { width: '6/12' },
          children: [],
        },
      ]
      break
    case 'column':
      base.props = {
        width: (preset.props?.width as string) ?? '6/12',
      }
      break
    case 'text-box':
      base.props = {
        text: (preset.props?.text as string) ?? 'Text box content',
      }
      break
    case 'style':
      base.props = preset.props ?? {}
      break
    default:
      base.props = preset.props ?? {}
  }

  return base
}
