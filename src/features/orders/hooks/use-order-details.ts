import { useQuery } from "@tanstack/react-query"
import { fetchOrder } from "../services/orders-api"
export function useOrderDetails(id?: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: ({ signal }) => {
      if (!id) throw new Error("An order ID is required")
      return fetchOrder(id, signal)
    },
    enabled: Boolean(id),
    retry: false,
  })
}
