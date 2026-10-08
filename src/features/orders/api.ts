import type {
  OrderListQuery,
  OrderListResponse,
  ApiErrorResponse,
} from "./api-types"
import { orderListSearchParams } from "./url-state"

export async function fetchOrders(
  query: OrderListQuery,
  signal: AbortSignal,
): Promise<OrderListResponse> {
  const url = new URL("/api/orders", window.location.origin)
  url.search = orderListSearchParams(query).toString()
  const response = await fetch(url, { signal })
  if (!response.ok) {
    const body = (await response.json()) as ApiErrorResponse
    throw new Error(body.error.message)
  }
  return response.json()
}
