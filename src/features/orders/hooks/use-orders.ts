import { useQuery } from "@tanstack/react-query"
import { fetchOrders } from "../services/orders-api"
import { orderListSearchParams } from "../utils/order-url"
import type { OrderListQuery } from "../order-api.types"
export function useOrders(query: OrderListQuery) {
  return useQuery({
    queryKey: ["orders", orderListSearchParams(query).toString()],
    queryFn: ({ signal }) => fetchOrders(query, signal),
    retry: false,
  })
}
