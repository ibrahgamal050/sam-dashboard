import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PlusCircle, Trash2, MoveUp, MoveDown } from 'lucide-react'

interface Image {
  name: string
  image: string
}

interface ComponentProps {
  [key: string]: any
}

interface Component {
  component_id: string
  type: string
  props: ComponentProps
  position: number
  _id: string
}

interface ComponentEditorProps {
  components: Component[]
  onUpdate: (updatedComponents: Component[]) => void
}

const ComponentEditor: React.FC<ComponentEditorProps> = ({ components, onUpdate }) => {
  const [editedComponents, setEditedComponents] = useState<Component[]>(components)

  const handleComponentChange = (componentId: string, field: string, value: any) => {
    setEditedComponents(prevComponents =>
      prevComponents.map(component =>
        component._id === componentId
          ? { ...component, props: { ...component.props, [field]: value } }
          : component
      )
    )
  }

  const handleImageChange = (componentId: string, index: number, field: keyof Image, value: string) => {
    setEditedComponents(prevComponents =>
      prevComponents.map(component =>
        component._id === componentId && component.props.images
          ? {
              ...component,
              props: {
                ...component.props,
                images: component.props.images.map((image: Image, i: number) =>
                  i === index ? { ...image, [field]: value } : image
                )
              }
            }
          : component
      )
    )
  }

  const handleAddImage = (componentId: string) => {
    setEditedComponents(prevComponents =>
      prevComponents.map(component =>
        component._id === componentId
          ? {
              ...component,
              props: {
                ...component.props,
                images: [
                  ...component.props.images,
                  { name: 'New Image', image: '/placeholder.svg?height=300&width=300' }
                ]
              }
            }
          : component
      )
    )
  }

  const handleDeleteComponent = (componentId: string) => {
    setEditedComponents(prevComponents =>
      prevComponents.filter(component => component._id !== componentId)
    )
  }

  const handleMoveComponent = (componentId: string, direction: 'up' | 'down') => {
    setEditedComponents(prevComponents => {
      const index = prevComponents.findIndex(component => component._id === componentId)
      if (index === -1) return prevComponents
      const newComponents = [...prevComponents]
      const [removed] = newComponents.splice(index, 1)
      newComponents.splice(direction === 'up' ? index - 1 : index + 1, 0, removed)
      return newComponents
    })
  }

  const handleSave = () => {
    onUpdate(editedComponents)
  }

  const renderComponentEditor = (component: Component) => {
    switch (component.type) {
      case 'Home':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${component._id}-title`}>Title</Label>
              <Input
                id={`${component._id}-title`}
                value={component.props.title}
                onChange={(e) => handleComponentChange(component._id, 'title', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${component._id}-subtitle`}>Subtitle</Label>
              <Input
                id={`${component._id}-subtitle`}
                value={component.props.subtitle}
                onChange={(e) => handleComponentChange(component._id, 'subtitle', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${component._id}-backgroundImage`}>Background Image</Label>
              <Input
                id={`${component._id}-backgroundImage`}
                value={component.props.backgroundImage}
                onChange={(e) => handleComponentChange(component._id, 'backgroundImage', e.target.value)}
              />
            </div>
          </div>
        )
      case 'FeaturedDishes':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${component._id}-title`}>Title</Label>
              <Input
                id={`${component._id}-title`}
                value={component.props.title}
                onChange={(e) => handleComponentChange(component._id, 'title', e.target.value)}
              />
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="dishes">
                <AccordionTrigger>Dishes</AccordionTrigger>
                <AccordionContent>
                  {component.props.dishes.map((dish: any, index: number) => (
                    <Card key={index} className="mb-4">
                      <CardHeader>
                        <CardTitle>Dish {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`${component._id}-dish-${index}-name`}>Name</Label>
                            <Input
                              id={`${component._id}-dish-${index}-name`}
                              value={dish.name}
                              onChange={(e) => handleComponentChange(component._id, `dishes[${index}].name`, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${component._id}-dish-${index}-description`}>Description</Label>
                            <Textarea
                              id={`${component._id}-dish-${index}-description`}
                              value={dish.description}
                              onChange={(e) => handleComponentChange(component._id, `dishes[${index}].description`, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${component._id}-dish-${index}-image`}>Image</Label>
                            <Input
                              id={`${component._id}-dish-${index}-image`}
                              value={dish.image}
                              onChange={(e) => handleComponentChange(component._id, `dishes[${index}].image`, e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button onClick={() => handleComponentChange(component._id, 'dishes', [...component.props.dishes, { name: '', description: '', image: '' }])} className="mt-4">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add New Dish
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )
      case 'TextSection':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${component._id}-title`}>Title</Label>
              <Input
                id={`${component._id}-title`}
                value={component.props.title}
                onChange={(e) => handleComponentChange(component._id, 'title', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${component._id}-content`}>Content</Label>
              <Textarea
                id={`${component._id}-content`}
                value={component.props.content}
                onChange={(e) => handleComponentChange(component._id, 'content', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${component._id}-image`}>Image</Label>
              <Input
                id={`${component._id}-image`}
                value={component.props.image}
                onChange={(e) => handleComponentChange(component._id, 'image', e.target.value)}
              />
            </div>
          </div>
        )
      case 'MenuList':
        return (
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="images">
                <AccordionTrigger>Menu Images</AccordionTrigger>
                <AccordionContent>
                  {component.props.images.map((image: Image, index: number) => (
                    <Card key={index} className="mb-4">
                      <CardHeader>
                        <CardTitle>Image {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`${component._id}-image-${index}-name`}>Name</Label>
                            <Input
                              id={`${component._id}-image-${index}-name`}
                              value={image.name}
                              onChange={(e) => handleImageChange(component._id, index, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${component._id}-image-${index}-url`}>Image URL</Label>
                            <Input
                              id={`${component._id}-image-${index}-url`}
                              value={image.image}
                              onChange={(e) => handleImageChange(component._id, index, 'image', e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button onClick={() => handleAddImage(component._id)} className="mt-4">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add New Image
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )
      case 'Map':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${component._id}-zoom`}>Zoom Level</Label>
              <Input
                id={`${component._id}-zoom`}
                type="number"
                value={component.props.zoom}
                onChange={(e) => handleComponentChange(component._id, 'zoom', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor={`${component._id}-title`}>Title</Label>
              <Input
                id={`${component._id}-title`}
                value={component.props.title}
                onChange={(e) => handleComponentChange(component._id, 'title', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${component._id}-description`}>Description</Label>
              <Textarea
                id={`${component._id}-description`}
                value={component.props.description}
                onChange={(e) => handleComponentChange(component._id, 'description', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${component._id}-mapImage`}>Map Image</Label>
              <Input
                id={`${component._id}-mapImage`}
                value={component.props.mapImage}
                onChange={(e) => handleComponentChange(component._id, 'mapImage', e.target.value)}
              />
            </div>
          </div>
        )
      default:
        return <p>Unknown component type: {component.type}</p>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Component Editor</CardTitle>
        <CardDescription>Edit and manage your page components</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <Accordion type="single" collapsible className="w-full">
            {editedComponents.map((component, index) => (
              <AccordionItem key={component._id} value={component._id}>
                <AccordionTrigger className="hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md">
                  <div className="flex items-center justify-between w-full">
                    <span>{component.type}</span>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleMoveComponent(component._id, 'up')} disabled={index === 0}>
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleMoveComponent(component._id, 'down')} disabled={index === editedComponents.length - 1}>
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteComponent(component._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6">
                      {renderComponentEditor(component)}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
      <Separator className="my-4" />
      <div className="px-6 py-4 flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </Card>
  )
}

export default ComponentEditor