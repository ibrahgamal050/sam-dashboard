import { ChevronUp, Utensils } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ICategory, IMenu } from "@/types/menu"

interface MenuPreviewProps {
  categories: ICategory[]
  menu: IMenu
  currentLanguage: "en" | "ar"
}

export function MenuPreview({ categories, menu, currentLanguage }: MenuPreviewProps) {
  return (
    <div className="space-y-8" dir={currentLanguage === "ar" ? "rtl" : "ltr"}>
      {categories?.map((category) => (
        <Card key={category._id?.toString()} className="overflow-hidden">
          <CardHeader className="bg-gray-50 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {category.name[currentLanguage] || category.name.en}
                  <Button variant="outline" size="icon" className="h-6 w-6 rounded-full">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </h3>
                {category.description && category.description[currentLanguage] && (
                  <p className="text-sm text-muted-foreground">{category.description[currentLanguage]}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                  <span className="sr-only">More options</span>
                  <svg width="15" height="3" viewBox="0 0 15 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1.5 1.5C1.5 1.89782 1.65804 2.27936 1.93934 2.56066C2.22064 2.84196 2.60218 3 3 3C3.39782 3 3.77936 2.84196 4.06066 2.56066C4.34196 2.27936 4.5 1.89782 4.5 1.5C4.5 1.10218 4.34196 0.720644 4.06066 0.43934C3.77936 0.158035 3.39782 0 3 0C2.60218 0 2.22064 0.158035 1.93934 0.43934C1.65804 0.720644 1.5 1.10218 1.5 1.5ZM6 1.5C6 1.89782 6.15804 2.27936 6.43934 2.56066C6.72064 2.84196 7.10218 3 7.5 3C7.89782 3 8.27936 2.84196 8.56066 2.56066C8.84196 2.27936 9 1.89782 9 1.5C9 1.10218 8.84196 0.720644 8.56066 0.43934C8.27936 0.158035 7.89782 0 7.5 0C7.10218 0 6.72064 0.158035 6.43934 0.43934C6.15804 0.720644 6 1.10218 6 1.5ZM10.5 1.5C10.5 1.89782 10.658 2.27936 10.9393 2.56066C11.2206 2.84196 11.6022 3 12 3C12.3978 3 12.7794 2.84196 13.0607 2.56066C13.342 2.27936 13.5 1.89782 13.5 1.5C13.5 1.10218 13.342 0.720644 13.0607 0.43934C12.7794 0.158035 12.3978 0 12 0C11.6022 0 11.2206 0.158035 10.9393 0.43934C10.658 0.720644 10.5 1.10218 10.5 1.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {category.menuItems.length > 0 ? (
              <div className="divide-y">
                {category.menuItems.map((item) => (
                  <div key={item._id?.toString()} className="flex items-start justify-between p-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-medium">{item.name[currentLanguage] || item.name.en}</span>
                        </div>
                        {item.description && item.description[currentLanguage] && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {item.description[currentLanguage]}
                          </p>
                        )}
                        {item.sizes && item.sizes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.sizes.map((size) => (
                              <div key={size._id?.toString()} className="flex justify-between text-sm">
                                <span>{size.name[currentLanguage] || size.name.en}</span>
                                <span className="font-medium">
                                  {size.price} {menu?.currency?.[currentLanguage] || menu?.currency?.en || "€"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!item.sizes || item.sizes.length === 0 ? (
                        <span className="font-medium">
                          {item.price} {menu?.currency?.[currentLanguage] || menu?.currency?.en || "€"}
                        </span>
                      ) : null}
                      {item.image && (
                        <div className="h-16 w-16 overflow-hidden rounded-md">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name[currentLanguage] || item.name.en || ""}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                            }}
                          />
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                        <span className="sr-only">More options</span>
                        <svg width="15" height="3" viewBox="0 0 15 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M1.5 1.5C1.5 1.89782 1.65804 2.27936 1.93934 2.56066C2.22064 2.84196 2.60218 3 3 3C3.39782 3 3.77936 2.84196 4.06066 2.56066C4.34196 2.27936 4.5 1.89782 4.5 1.5C4.5 1.10218 4.34196 0.720644 4.06066 0.43934C3.77936 0.158035 3.39782 0 3 0C2.60218 0 2.22064 0.158035 1.93934 0.43934C1.65804 0.720644 1.5 1.10218 1.5 1.5ZM6 1.5C6 1.89782 6.15804 2.27936 6.43934 2.56066C6.72064 2.84196 7.10218 3 7.5 3C7.89782 3 8.27936 2.84196 8.56066 2.56066C8.84196 2.27936 9 1.89782 9 1.5C9 1.10218 8.84196 0.720644 8.56066 0.43934C8.27936 0.158035 7.89782 0 7.5 0C7.10218 0 6.72064 0.158035 6.43934 0.43934C6.15804 0.720644 6 1.10218 6 1.5ZM10.5 1.5C10.5 1.89782 10.658 2.27936 10.9393 2.56066C11.2206 2.84196 11.6022 3 12 3C12.3978 3 12.7794 2.84196 13.0607 2.56066C13.342 2.27936 13.5 1.89782 13.5 1.5C13.5 1.10218 13.342 0.720644 13.0607 0.43934C12.7794 0.158035 12.3978 0 12 0C11.6022 0 11.2206 0.158035 10.9393 0.43934C10.658 0.720644 10.5 1.10218 10.5 1.5Z"
                            fill="currentColor"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-center">
                <div>
                  <Utensils className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No items in this section</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add items to this section to display them on your menu.
                  </p>
                  <Button className="mt-4">Add Item</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
