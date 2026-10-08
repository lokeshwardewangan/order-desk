import type { z } from "zod"
import type {
  orderSummarySchema,
  orderSchema,
  orderItemSchema,
  shippingAddressSchema,
  orderTimelineEventSchema,
} from "./schemas/order-response.schema"
import type { ORDER_STATUSES } from "./order.constants"
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type OrderSummary = z.infer<typeof orderSummarySchema>
export type Customer = OrderSummary["customer"]
export type OrderItem = z.infer<typeof orderItemSchema>
export type ShippingAddress = z.infer<typeof shippingAddressSchema>
export type OrderTimelineEvent = z.infer<typeof orderTimelineEventSchema>
export type Order = z.infer<typeof orderSchema>
