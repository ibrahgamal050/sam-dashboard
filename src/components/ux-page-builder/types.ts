export interface Component {
  id: string
  type: 'banner' | 'text-box' | 'row' | 'column' | 'text' | 'button' | 'image'
  props?: {
    width?: string
    text?: string
    src?: string
    [key: string]: any
  }
  children?: Component[]
}

export interface ComponentTreeProps {
  components: Component[]
  selectedId: string | null
  onSelect: (id: string) => void
}

