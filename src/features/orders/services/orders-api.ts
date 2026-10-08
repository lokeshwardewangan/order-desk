import type {
  OrderListQuery,
  OrderListResponse,
  ApiErrorResponse,
} from "../order-api.types"
import { orderListSearchParams } from "../utils/order-url"
import {
  apiErrorResponseSchema,
  orderListResponseSchema,
} from "../schemas/order-response.schema"
export class OrdersApiError extends Error {
  readonly status: number
  readonly code?: ApiErrorResponse["error"]["code"]
  readonly fields?: Record<string, string>
  constructor(
    status: number,
    message: string,
    error?: ApiErrorResponse["error"],
  ) {
    super(message)
    this.name = "OrdersApiError"
    this.status = status
    this.code = error?.code
    this.fields = error?.fields
  }
}
export async function fetchOrders(
  query: OrderListQuery,
  signal: AbortSignal,
): Promise<OrderListResponse> {
  const url = new URL("/api/orders", window.location.origin)
  url.search = orderListSearchParams(query).toString()
  const response = await fetch(url, { signal })
  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    if (signal.aborted) throw error
    throw new OrdersApiError(
      response.status,
      response.ok
        ? "The orders service returned an invalid response."
        : "The orders service could not complete the request. Please retry.",
    )
  }
  if (!response.ok) {
    const parsed = apiErrorResponseSchema.safeParse(body)
    throw parsed.success
      ? new OrdersApiError(
          response.status,
          parsed.data.error.message,
          parsed.data.error,
        )
      : new OrdersApiError(
          response.status,
          "The orders service could not complete the request. Please retry.",
        )
  }
  const parsed = orderListResponseSchema.safeParse(body)
  if (!parsed.success)
    throw new OrdersApiError(
      response.status,
      "The orders service returned an invalid response.",
    )
  return parsed.data
}
