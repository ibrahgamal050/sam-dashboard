"use client"

import { useState } from "react"
import { MoreHorizontal, Edit, Trash2, Eye, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MenuCardProps {
  id: string
  title: string
  sections: number
  items: number
  thumbnail?: string
  isActive?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  onManage?: (id: string) => void
  onToggleStatus?: (id: string, isActive: boolean) => void
}

export function MenuCard({
  id,
  title,
  sections,
  items,
  thumbnail,
  isActive = true,
  onEdit,
  onDelete,
  onView,
  onManage,
  onToggleStatus,
}: MenuCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className={`transition-all duration-200 ${isHovered ? "shadow-md" : "shadow-xs"} ${!isActive ? "opacity-70" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isActive ? "default" : "outline-solid"} className="text-xs">
                {isActive ? "Active" : "Inactive"}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs">
                      Ordering: Enabled
                      <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 -mr-1 hover:bg-transparent">
                        <span className="sr-only">Learn more about ordering</span>
                        ℹ️
                      </Button>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This menu is available for online ordering</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(id)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>View Menu</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(id)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManage?.(id)}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>Manage Items</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleStatus?.(id, !isActive)} className="text-amber-600">
                <span>{isActive ? "Deactivate" : "Activate"} Menu</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Menu</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="w-full sm:w-[200px] h-[140px] shrink-0 rounded-lg border bg-muted/10 overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail || "/placeholder.svg"}
                alt={`${title} thumbnail`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full p-4">
                <div className="space-y-2">
                  <div className="h-2 w-3/4 rounded-lg bg-muted" />
                  <div className="h-2 w-1/2 rounded-lg bg-muted" />
                  <div className="flex items-center gap-1">
                    <div className="h-8 w-8 rounded-lg bg-muted" />
                    <div className="h-2 w-16 rounded-lg bg-muted" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-8 w-8 rounded-lg bg-muted" />
                    <div className="h-2 w-20 rounded-lg bg-muted" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-8 w-8 rounded-lg bg-muted" />
                    <div className="h-2 w-14 rounded-lg bg-muted" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-2">
              <span className="font-medium text-foreground">{sections}</span> sections •{" "}
              <span className="font-medium text-foreground">{items}</span> items
            </div>
            <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => onEdit?.(id)}>
          Edit Menu Details
        </Button>
        <Button onClick={() => onManage?.(id)}>Manage</Button>
      </CardFooter>
    </Card>
  )
}

