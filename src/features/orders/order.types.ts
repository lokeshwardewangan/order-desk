import type { z } from "zod"
import type { orderSummarySchema } from "./schemas/order-response.schema"
import type { ORDER_STATUSES } from "./order.constants"
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type Customer = OrderSummary["customer"]

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
export type OrderSummary = z.infer<typeof orderSummarySchema>

export interface Order extends OrderSummary {
  items: OrderItem[]
  shippingAddress: ShippingAddress
  timeline: OrderTimelineEvent[]
}
