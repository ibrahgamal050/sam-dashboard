"use client"

import { useMemo, useState } from "react"
import { Search, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const MOCK_CUSTOMERS = [
  {
    id: "CUS-001",
    name: "Sara Ahmed",
    email: "sara.ahmed@example.com",
    phone: "+20 101 234 5678",
    orders: 12,
    lastOrder: "2024-06-18",
  },
  {
    id: "CUS-002",
    name: "Mohamed Ali",
    email: "mohamed.ali@example.com",
    phone: "+20 112 987 6543",
    orders: 4,
    lastOrder: "2024-06-12",
  },
  {
    id: "CUS-003",
    name: "Laila Hassan",
    email: "laila.hassan@example.com",
    phone: "+20 109 321 8765",
    orders: 19,
    lastOrder: "2024-06-10",
  },
  {
    id: "CUS-004",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+20 100 555 8821",
    orders: 2,
    lastOrder: "2024-05-28",
  },
]

export default function CustomersPage() {
  const [query, setQuery] = useState("")

  const filteredCustomers = useMemo(() => {
    if (!query.trim()) return MOCK_CUSTOMERS
    const q = query.toLowerCase()
    return MOCK_CUSTOMERS.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.id].some((value) =>
        value.toLowerCase().includes(q),
      ),
    )
  }, [query])

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Customers</h1>
          <p className="text-sm text-slate-500">Track guest details, engagement, and order history.</p>
        </div>
        <Button className="gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search customers"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 rounded-full border-slate-300 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Customer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Last Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No customers match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium text-slate-900">{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell className="text-slate-500">{customer.email}</TableCell>
                    <TableCell className="text-slate-500">{customer.phone}</TableCell>
                    <TableCell className="text-right font-medium text-slate-900">{customer.orders}</TableCell>
                    <TableCell className="text-right text-slate-500">{customer.lastOrder}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}
