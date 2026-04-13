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
import { IRestaurant } from "@/types/restaurant"


interface RestaurantsTableProps {
  data: IRestaurant[]
  isLoading?: boolean
  className?: string
}

type SortField = "name" | "subdomain" | "status" | "createdAt"
type SortDirection = "asc" | "desc"

export function RestaurantsTable({ data, isLoading = false, className }: RestaurantsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter data based on search query and status
  const filteredData = data.filter((restaurant) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      restaurant.name.en.toLowerCase().includes(q) ||
      restaurant.name.ar.includes(searchQuery) ||
      restaurant.subdomain.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && restaurant.isPublished) ||
      (statusFilter === "draft" && !restaurant.isPublished)

    return matchesSearch && matchesStatus
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortField === "name") {
      const aName = a.name.ar || a.name.en
      const bName = b.name.ar || b.name.en
      return sortDirection === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName)
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
    <Card className={cn("w-full border-[#d9ecff] bg-white/80 text-right shadow-2xl backdrop-blur", className)}>
      <CardHeader className="flex flex-col gap-3 border-b border-[#edf6ff] pb-5 sm:flex-row-reverse sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2f7fb2]">المحفظة</p>
          <CardTitle className="text-2xl">المطاعم</CardTitle>
          <CardDescription className="max-w-xl">
            إدارة قوائم المطاعم والحفاظ على تجربة موحدة.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-[#cfe6ff] text-[#256a9a] hover:bg-[#edf6ff]">
            تصدير
          </Button>
          <Button variant="default" asChild className="bg-[#46b6ff] text-white hover:bg-[#3aa7df]">
            <Link href="/dashboard/restaurants/new">إضافة مطعم</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مطعم..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-full border-[#d9ecff] pr-9 text-right sm:w-[320px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => handleStatusChange(value as "all" | "published" | "draft")}
              >
                <SelectTrigger className="w-[200px] rounded-full border-[#d9ecff]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="تصفية حسب الحالة" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المطاعم</SelectItem>
                  <SelectItem value="published">المنشور فقط</SelectItem>
                  <SelectItem value="draft">المسودات فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9ecff]/80 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#eef6ff]">
                  <TableHead className="cursor-pointer text-xs uppercase tracking-wide text-muted-foreground" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      الاسم
                      {sortField === "name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs uppercase tracking-wide text-muted-foreground" onClick={() => handleSort("subdomain")}>
                    <div className="flex items-center gap-1">
                      النطاق الفرعي
                      {sortField === "subdomain" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-xs uppercase tracking-wide text-muted-foreground" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">
                      الحالة
                      {sortField === "status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-left text-xs uppercase tracking-wide text-muted-foreground">الإجراءات</TableHead>
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
                        <h3 className="font-medium">لا توجد مطاعم مطابقة</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || statusFilter !== "all"
                            ? "جرّب تعديل البحث أو الفلاتر"
                            : "ابدأ بإضافة أول مطعم"}
                        </p>
                        {!searchQuery && statusFilter === "all" && (
                          <Button variant="outline" className="mt-2" asChild>
                            <Link href="/dashboard/restaurants/new">إضافة مطعم</Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((restaurant) => (
                    <TableRow key={restaurant._id ?? restaurant.subdomain} className="group hover:bg-[#edf6ff]/50">
                     <TableCell className="font-medium">
  <div className="flex items-center gap-3 group">
    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[#edf6ff] bg-muted">
      {restaurant.logo ? (
        <img
          src={`/images${restaurant?.coverImage}`}
          alt={restaurant.name.ar || restaurant.name.en}
          className="h-full w-full object-cover transition-all group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Store className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>

    <div>
      <div className="flex items-center gap-1 font-semibold">
        {restaurant.name.ar || restaurant.name.en}

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
                  <span className="sr-only">فتح لوحة التحكم</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>فتح لوحة التحكم</p>
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
    <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-semibold text-[#2f7fb2]">
      {restaurant.subdomain}
    </span>
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
              <span className="sr-only">زيارة الموقع</span>
            </Button>
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>زيارة موقع المطعم</p>
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
                          {restaurant.isPublished ? "منشور" : "مسودة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center justify-start gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/dashboard/restaurants/${restaurant._id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">عرض المطعم</span>
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>عرض التفاصيل</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/dashboard/restaurants/${restaurant._id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">تعديل المطعم</span>
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>تعديل المطعم</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <span className="sr-only">فتح القائمة</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/restaurants/${restaurant._id}`}>
                                  <Eye className="ml-2 h-4 w-4" />
                                  عرض التفاصيل
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/restaurants/${restaurant._id}/edit`}>
                                  <Edit className="ml-2 h-4 w-4" />
                                  تعديل المطعم
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ExternalLink className="ml-2 h-4 w-4" />
                                زيارة الموقع
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash className="ml-2 h-4 w-4" />
                                حذف المطعم
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
                عرض {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredData.length)} من {filteredData.length} مطعم
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
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
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
