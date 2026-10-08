import type { z } from "zod"
import type { ORDER_SORTS } from "./order.constants"
import type { orderQuerySchema } from "./schemas/order-query.schema"
import type {
  orderListResponseSchema,
  apiErrorResponseSchema,
  orderDetailResponseSchema,
} from "./schemas/order-response.schema"
export type OrderSort = (typeof ORDER_SORTS)[number]
export type OrderListQuery = z.infer<typeof orderQuerySchema>
export type OrderListResponse = z.infer<typeof orderListResponseSchema>
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>

export type OrderDetailResponse = z.infer<typeof orderDetailResponseSchema>
