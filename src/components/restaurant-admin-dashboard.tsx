'use client'

import { useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  Title, 
  Tooltip, 
  Legend,
  PointElement
} from 'chart.js'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { BarChart, Users, Utensils, DollarSign, ShoppingBag, Bell, Settings, LogOut } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
)

export function RestaurantAdminDashboardComponent() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  }

  const ordersData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">Restaurant Admin</h1>
        </div>
        <nav className="mt-4">
          <Button
            variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Orders
          </Button>
          <Button
            variant={activeTab === 'menu' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('menu')}
          >
            <Utensils className="mr-2 h-4 w-4" />
            Menu
          </Button>
          <Button
            variant={activeTab === 'customers' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('customers')}
          >
            <Users className="mr-2 h-4 w-4" />
            Customers
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2350</div>
              <p className="text-xs text-muted-foreground">+180.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+201 orders today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">+201 since last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar data={salesData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <Line data={ordersData} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>You have 3 orders that need to be fulfilled</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>#3210</TableCell>
                  <TableCell>John Doe</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Preparing
                    </span>
                  </TableCell>
                  <TableCell>$25.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>#3209</TableCell>
                  <TableCell>Jane Smith</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Completed
                    </span>
                  </TableCell>
                  <TableCell>$42.50</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>#3208</TableCell>
                  <TableCell>Bob Johnson</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      Cancelled
                    </span>
                  </TableCell>
                  <TableCell>$18.75</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}