export type OrderItem = {
  id: string
  name: string
  qty: number
  course: "APPETIZER" | "ENTREE" | "DESSERT" | "DRINK"
  modifiers?: string[]
  tags?: ("VEG" | "SPICY" | "GF")[]
}

export type Order = {
  id: string
  number: number
  table?: string
  type: "dine_in" | "takeaway" | "delivery"
  createdAt: string
  etaMinutes?: number
  status: "pending" | "in_progress" | "ready" | "served" | "canceled"
  items: OrderItem[]
  notes?: string
  station: "wings" | "burger" | "fries" | "potatoes" | "drinks" | "expo"
  priority?: "normal" | "rush"
  fulfilledAt?: string
}

export type Station = "wings" | "burger" | "fries" | "potatoes" | "drinks" | "expo"
