import type {
  OrderListQuery,
  OrderListResponse,
} from "../../features/orders/order-api.types"
import type { Order, OrderSummary } from "../../features/orders/order.types"
import { dateBoundary } from "../../features/orders/utils/order-date"

function summary(order: Order): OrderSummary {
  const {
    id,
    customer,
    placedAt,
    status,
    currency,
    totalAmountPaise,
    itemCount,
  } = order
  return {
    id,
    customer,
    placedAt,
    status,
    currency,
    totalAmountPaise,
    itemCount,
  }
}

export function queryOrders(
  source: readonly Order[],
  query: OrderListQuery,
): OrderListResponse {
  const search = query.q.toLowerCase()
  const fromTime = query.from ? dateBoundary(query.from) : -Infinity
  const toTime = query.to ? dateBoundary(query.to, true) : Infinity

  const matches = source
    .map((order) => ({ order, time: Date.parse(order.placedAt) }))
    .filter(({ order, time }) => {
      if (
        search &&
        ![order.id, order.customer.name, order.customer.email].some((value) =>
          value.toLowerCase().includes(search),
        )
      )
        return false
      if (query.status && order.status !== query.status) return false
      if (time < fromTime || time > toTime) return false
      if (
        query.minAmountPaise !== undefined &&
        order.totalAmountPaise < query.minAmountPaise
      )
        return false
      if (
        query.maxAmountPaise !== undefined &&
        order.totalAmountPaise > query.maxAmountPaise
      )
        return false
      return true
    })

  matches.sort((a, b) => {
    const difference = query.sort.startsWith("date")
      ? a.time - b.time
      : a.order.totalAmountPaise - b.order.totalAmountPaise
    return (
      (query.sort.endsWith("desc") ? -difference : difference) ||
      a.order.id.localeCompare(b.order.id)
    )
  })

  const start = (query.page - 1) * query.pageSize
  return {
    data: matches
      .slice(start, start + query.pageSize)
      .map(({ order }) => summary(order)),
    total: matches.length,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(matches.length / query.pageSize),
  }
}
