// Default builder-driven Orders page definition.
// Layout + theme + data bindings so each restaurant can re-theme/reorder without changing code.

type BuilderText = {
  type: "text"
  value: string
  settings?: Record<string, any>
}

type BuilderElement = {
  id?: string
  type: string
  position?: number
  role?: string
  columns?: BuilderElement[]
  children?: BuilderElement[]
  [key: string]: any
}

type BuilderSection = {
  id: string
  key: string
  type: string
  position: number
  layout: Record<string, any>
  elements: BuilderElement[]
}

type BindingConfig = {
  id: string
  type: "orders"
  resource: "/api/orders"
  params: Record<string, any>
  shape?: Record<string, any>
}

export type OrdersBuilderPage = {
  id: string
  name: string
  slug: string
  theme: Record<string, any>
  bindings: BindingConfig[]
  sections: BuilderSection[]
}

export const ORDERS_BUILDER_PAGE: OrdersBuilderPage = {
  id: "orders-builder-v1",
  name: "Orders",
  slug: "orders",
  theme: {
    palette: {
      primary: "#0EBE7F",
      accent: "#FF5C2B",
      muted: "#F5F5F5",
      border: "#E5E7EB",
      text: "#1F2937",
      success: "#16A34A",
      warning: "#F59E0B",
      danger: "#EF4444",
    },
    typography: {
      heading: { family: "Inter", weight: 700, size: 18 },
      body: { family: "Inter", weight: 500, size: 14 },
      small: { family: "Inter", weight: 500, size: 12 },
    },
    cards: {
      radius: 16,
      shadow: true,
    },
  },
  bindings: [
    {
      id: "orders",
      type: "orders",
      resource: "/api/orders",
      params: {
        restaurantId: "{{restaurant._id}}",
        limit: 100,
        includeReady: true,
      },
      shape: {
        orderId: "string",
        orderNumber: "string",
        status: "string",
        type: "string",
        totalPrice: "number",
        currency: "string",
        customer: { name: "string", phone: "string" },
        createdAt: "date",
        payment: { status: "string", method: "string" },
        address: "any",
        items: "array",
      },
    },
  ],
  sections: [
    {
      id: "orders-hero",
      key: "orders-hero",
      type: "hero",
      position: 1,
      layout: {
        columns: 2,
        align: "center",
        justify: "space-between",
      },
      elements: [
        {
          id: "orders-title",
          type: "text",
          text: { type: "text", value: "Orders", settings: { variant: "heading", size: "lg" } } as BuilderText,
        },
        {
          id: "orders-filters",
          type: "filters",
          role: "filters",
          filters: [
            { type: "search", placeholder: "Search order / customer" },
            {
              type: "select",
              label: "Status",
              options: [
                { label: "All", value: "" },
                { label: "Pending", value: "pending" },
                { label: "In progress", value: "in_progress" },
                { label: "Ready", value: "ready" },
                { label: "Delivered", value: "delivered" },
                { label: "Canceled", value: "canceled" },
              ],
              bind: "status",
            },
            {
              type: "toggle",
              label: "Auto accept",
              bind: "autoAccept",
            },
          ],
        },
      ],
    },
    {
      id: "orders-list",
      key: "orders-list",
      type: "list",
      position: 2,
      layout: {
        columns: 3,
        gap: 16,
      },
      elements: [
        {
          id: "orders-repeat",
          type: "repeat",
          source: "bindings.orders",
          as: "order",
          children: [
            {
              id: "order-card",
              type: "card",
              role: "order-card",
              header: {
                title: "{{order.orderNumber || order.orderId}}",
                subtitle: "{{order.customer.name || 'Guest'}}",
                badges: [
                  { text: "{{order.status}}", tone: "status" },
                  { text: "{{order.payment.status || 'Paid'}}", tone: "muted" },
                ],
              },
              body: [
                { type: "text", value: "Total: {{order.totalPrice}} {{order.currency || 'USD'}}" },
                { type: "text", value: "Created: {{order.createdAt}}" },
                { type: "text", value: "Type: {{order.type}}" },
              ],
              footer: [
                { type: "button", label: "Accept", action: { type: "status", value: "in_progress" } },
                { type: "button", label: "Ready", action: { type: "status", value: "ready" } },
                { type: "button", label: "Deliver", action: { type: "status", value: "delivered" } },
                { type: "button", label: "Cancel", variant: "outline", action: { type: "status", value: "canceled" } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
