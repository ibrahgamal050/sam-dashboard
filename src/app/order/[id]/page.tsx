// Server component: unwrap params with await (Next 15)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Phone, MessageCircle, MapPin, MoreVertical } from "lucide-react"

interface OrderItem {
  id: string
  name: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
  image: string
}

interface HistoryItem {
  id: string
  title: string
  time: string
}

interface OrderDetails {
  id: string
  status: "on-delivery" | "delivered" | "preparing" | "placed"
  estimatedTime: string
  customer: {
    name: string
    avatar: string
  }
  driver: {
    name: string
    id: string
    phone: string
    email: string
    avatar: string
  }
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  history: HistoryItem[]
}

export default async function OrderDetailsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Mock data - in real app this would come from API
  const orderData: OrderDetails = {
    id,
    status: "on-delivery",
    estimatedTime: "2 - 6 min",
    customer: {
      name: "David D Goa",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    driver: {
      name: "James Sukardi",
      id: "#SAL-111234125",
      phone: "021 2346 664",
      email: "info@mail.com",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    items: [
      {
        id: "1",
        name: "Original Big Burger with Extra Spicy",
        category: "FOOD",
        quantity: 2,
        unitPrice: 8.6,
        totalPrice: 17.2,
        image: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "2",
        name: "Original Big Burger with Extra Spicy",
        category: "FOOD",
        quantity: 2,
        unitPrice: 8.6,
        totalPrice: 17.2,
        image: "/placeholder.svg?height=80&width=80",
      },
    ],
    subtotal: 25.8,
    tax: 2.58,
    total: 28.38,
    history: [
      { id: "1", title: "Your Order on Delivery by Courier", time: "09:23 AM" },
      { id: "2", title: "Driver Arrived at Restaurant", time: "09:23 AM" },
      { id: "3", title: "Preparing Your Order", time: "09:23 AM" },
      { id: "4", title: "Placed Order", time: "09:23 AM" },
    ],
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-delivery":
        return "bg-blue-500"
      case "delivered":
        return "bg-green-500"
      case "preparing":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "on-delivery":
        return "On Delivery"
      case "delivered":
        return "Delivered"
      case "preparing":
        return "Preparing"
      default:
        return "Placed"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Map Section */}
          <div className="w-full h-[450px] rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14448.885880295826!2d75.81852004999999!3d25.128202399999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1682845569584!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* History Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="max-h-[300px] overflow-y-auto px-6">
                  <div className="space-y-4">
                    {orderData.history.map((item, index) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${index === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                        <div className="flex-1">
                          <h6 className="font-semibold text-sm">{item.title}</h6>
                          <span className="text-blue-500 text-sm">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Section */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Details</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="text-blue-500 border-blue-500 mb-1">
                          {item.category}
                        </Badge>
                        <h6 className="font-medium text-sm">{item.name}</h6>
                        <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">${item.unitPrice}</span>
                          <h6 className="font-semibold text-blue-500">${item.totalPrice}</h6>
                        </div>
                      </div>
                    </div>
                  ))}

                  <hr className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <h6 className="font-semibold">${orderData.subtotal}</h6>
                    </div>
                    <div className="flex justify-between">
                      <span>PPN (10%)</span>
                      <h6 className="font-semibold">${orderData.tax}</h6>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className={`${getStatusColor(orderData.status)} text-white`}>
            <CardContent className="text-center py-6">
              <h3 className="text-2xl font-bold mb-1">{getStatusText(orderData.status)}</h3>
              <span>Estimated Time {orderData.estimatedTime}</span>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card>
            <CardContent className="py-6">
              <div className="text-center space-y-4">
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarImage src={orderData.customer.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {orderData.customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{orderData.customer.name}</h4>
                  <p className="text-muted-foreground">Customer</p>
                </div>
                <div className="flex justify-center space-x-3">
                  <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Card */}
          <Card>
            <CardContent className="py-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={orderData.driver.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {orderData.driver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h6 className="font-semibold">{orderData.driver.name}</h6>
                    <p className="text-blue-500 text-sm">{orderData.driver.id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <div>
                    <span className="text-sm text-muted-foreground">Telephone</span>
                    <h6 className="font-semibold">{orderData.driver.phone}</h6>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <div>
                    <span className="text-sm text-muted-foreground">Email</span>
                    <h6 className="font-semibold">{orderData.driver.email}</h6>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
