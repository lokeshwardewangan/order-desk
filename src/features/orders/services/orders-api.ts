import type {
  OrderListQuery,
  OrderListResponse,
  ApiErrorResponse,
  OrderDetailResponse,
} from "../order-api.types"
import { orderListSearchParams } from "../utils/order-url"
import {
  apiErrorResponseSchema,
  orderListResponseSchema,
  orderDetailResponseSchema,
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
async function readOrderResponse(response: Response, signal: AbortSignal) {
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
  return body
}
export async function fetchOrders(
  query: OrderListQuery,
  signal: AbortSignal,
): Promise<OrderListResponse> {
  const url = new URL("/api/orders", window.location.origin)
  url.search = orderListSearchParams(query).toString()
  const response = await fetch(url, { signal })
  const body = await readOrderResponse(response, signal)
  const parsed = orderListResponseSchema.safeParse(body)
  if (!parsed.success)
    throw new OrdersApiError(
      response.status,
      "The orders service returned an invalid response.",
    )
  return parsed.data
}
export async function fetchOrder(
  id: string,
  signal: AbortSignal,
): Promise<OrderDetailResponse> {
  const response = await fetch(
    new URL("/api/orders/" + encodeURIComponent(id), window.location.origin),
    { signal },
  )
  const body = await readOrderResponse(response, signal)
  const parsed = orderDetailResponseSchema.safeParse(body)
  if (!parsed.success || parsed.data.data.id !== id)
    throw new OrdersApiError(
      response.status,
      "The orders service returned an invalid response.",
    )
  return parsed.data
}
