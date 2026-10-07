export const ORDER_STATUSES = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface Customer {
  name: string
  email: string
}

export interface OrderItem {
  sku: string
  name: string
  quantity: number
  unitPricePaise: number
}

export interface ShippingAddress {
  line1: string
  city: string
  state: string
  postalCode: string
  country: "India"
}

export interface OrderTimelineEvent {
  status: "placed" | OrderStatus
  occurredAt: string
}

// The list API will return summaries without the heavier detail fields.
export interface OrderSummary {
  id: string
  customer: Customer
  placedAt: string
  status: OrderStatus
  currency: "INR"
  totalAmountPaise: number
  itemCount: number
}

export interface Order extends OrderSummary {
  items: OrderItem[]
  shippingAddress: ShippingAddress
  timeline: OrderTimelineEvent[]
}
