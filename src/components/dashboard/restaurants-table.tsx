"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash,
  Store,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {IRestaurant} from '@/types/restaurant'


interface RestaurantsTableProps {
  data: IRestaurant
  isLoading?: boolean
}

type SortField = "name" | "subdomain" | "status" | "createdAt"
type SortDirection = "asc" | "desc"

export function RestaurantsTable({ data, isLoading = false }: RestaurantsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter data based on search query and status
  const filteredData = data.filter((restaurant) => {
    const matchesSearch =
      restaurant.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.name.ar.includes(searchQuery) ||
      restaurant.subdomain.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && restaurant.isPublished) ||
      (statusFilter === "draft" && !restaurant.isPublished)

    return matchesSearch && matchesStatus
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" ? a.name.en.localeCompare(b.name.en) : b.name.en.localeCompare(a.name.en)
    } else if (sortField === "subdomain") {
      return sortDirection === "asc" ? a.subdomain.localeCompare(b.subdomain) : b.subdomain.localeCompare(a.subdomain)
    } else if (sortField === "status") {
      return sortDirection === "asc"
        ? Number(a.isPublished) - Number(b.isPublished)
        : Number(b.isPublished) - Number(a.isPublished)
    } else if (sortField === "createdAt" && a.createdAt && b.createdAt) {
      return sortDirection === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Reset pagination when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: "all" | "published" | "draft") => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Restaurants</CardTitle>
        <CardDescription>Manage your restaurant listings and their settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 sm:w-[300px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => handleStatusChange(value as "all" | "published" | "draft")}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Restaurants</SelectItem>
                  <SelectItem value="published">Published Only</SelectItem>
                  <SelectItem value="draft">Drafts Only</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" asChild>
                <Link href="/dashboard/restaurants/new">Add Restaurant</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Name
                      {sortField === "name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("subdomain")}>
                    <div className="flex items-center gap-1">
                      Subdomain
                      {sortField === "subdomain" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-10 w-10 rounded-md" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-3 w-[100px]" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[80px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-[300px] text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Store className="h-8 w-8 text-muted-foreground" />
                        <h3 className="font-medium">No restaurants found</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || statusFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Get started by adding your first restaurant"}
                        </p>
                        {!searchQuery && statusFilter === "all" && (
                          <Button variant="outline" className="mt-2" asChild>
                            <Link href="/dashboard/restaurants/new">Add Restaurant</Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((restaurant) => (
                    <TableRow key={restaurant._id} className="group">
                     <TableCell className="font-medium">
  <div className="flex items-center gap-3 group">
    <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
      {restaurant.logo ? (
        <img
          src={`/images${restaurant?.coverImage}`}
          alt={restaurant.name.en}
          className="h-full w-full object-cover transition-all group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Store className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>

    <div>
      <div className="font-medium flex items-center gap-1">
        {restaurant.name.en}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/dashboard/${restaurant.subdomain}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="sr-only">Open Dashboard</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open Dashboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-xs text-muted-foreground">{restaurant.name.ar}</div>
    </div>
  </div>
</TableCell>

                      <TableCell>
  <div className="flex items-center gap-1 group">
    <span>{restaurant.subdomain}</span>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`https://${restaurant.subdomain}.meelza.site`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="sr-only">Visit site</span>
            </Button>
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>Visit restaurant site</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</TableCell>
                      <TableCell>
                        <Badge
                          variant={restaurant.isPublished ? "default" : "outline"}
                          className={cn(
                            "transition-all",
                            restaurant.isPublished
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "hover:border-muted-foreground",
                          )}
                        >
                          {restaurant.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/dashboard/restaurants/${restaurant._id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View restaurant</span>
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/dashboard/restaurants/${restaurant._id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit restaurant</span>
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit restaurant</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/restaurants/${restaurant._id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/restaurants/${restaurant._id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Restaurant
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Visit Website
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Restaurant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} restaurants
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageToShow = i + 1
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageToShow = currentPage - 3 + i
                    }
                    if (currentPage > totalPages - 2) {
                      pageToShow = totalPages - 4 + i
                    }
                  }

                  if (pageToShow <= totalPages) {
                    return (
                      <Button
                        key={pageToShow}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageToShow)}
                        className="w-9"
                      >
                        {pageToShow}
                      </Button>
                    )
                  }
                  return null
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
