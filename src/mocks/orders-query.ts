import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  ORDER_SORTS,
} from "../features/orders/api-types"
import type {
  OrderListQuery,
  OrderListResponse,
  OrderSort,
} from "../features/orders/api-types"
import { ORDER_STATUSES } from "../features/orders/types"
import type { Order, OrderStatus, OrderSummary } from "../features/orders/types"

export class InvalidOrderQuery extends Error {
  fields: Record<string, string>
  constructor(fields: Record<string, string>) {
    super("Some order filters are invalid")
    this.name = "InvalidOrderQuery"
    this.fields = fields
  }
}
export function dateBoundary(value: string, endOfDay = false): number {
  return Date.parse(
    value + (endOfDay ? "T23:59:59.999+05:30" : "T00:00:00.000+05:30"),
  )
}

export function parseOrderQuery(params: URLSearchParams): OrderListQuery {
  const fields: Record<string, string> = {}

  function integer(
    key: string,
    fallback?: number,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
  ) {
    const raw = params.get(key)
    if (raw === null || raw === "") return fallback
    const value = Number(raw)
    if (
      !/^\d+$/.test(raw) ||
      !Number.isSafeInteger(value) ||
      value < min ||
      value > max
    ) {
      fields[key] = "Enter a whole number between " + min + " and " + max
      return fallback
    }
    return value
  }

  function date(key: string) {
    const raw = params.get(key)
    if (!raw) return undefined
    const time = Date.parse(raw + "T00:00:00.000Z")
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(raw) ||
      !Number.isFinite(time) ||
      new Date(time).toISOString().slice(0, 10) !== raw
    ) {
      fields[key] = "Enter a valid date in YYYY-MM-DD format"
      return undefined
    }
    return raw
  }

  const rawStatus = params.get("status")
  const status =
    !rawStatus || rawStatus === "all" ? undefined : (rawStatus as OrderStatus)
  if (status && !ORDER_STATUSES.includes(status))
    fields.status = "Choose a supported order status"
  const sort = (params.get("sort") || "date-desc") as OrderSort
  if (!ORDER_SORTS.includes(sort)) fields.sort = "Choose a supported sort order"
  const from = date("from")
  const to = date("to")
  if (from && to && from > to)
    fields.to = "End date must be on or after start date"
  const minAmountPaise = integer("minAmountPaise")
  const maxAmountPaise = integer("maxAmountPaise")
  if (
    minAmountPaise !== undefined &&
    maxAmountPaise !== undefined &&
    minAmountPaise > maxAmountPaise
  ) {
    fields.maxAmountPaise = "Maximum amount must be at least the minimum amount"
  }
  const pageSize = integer("pageSize", DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)!
  const page = integer(
    "page",
    1,
    1,
    Math.floor(Number.MAX_SAFE_INTEGER / pageSize),
  )!

  if (Object.keys(fields).length) throw new InvalidOrderQuery(fields)
  return {
    q: (params.get("q") || "").trim(),
    status,
    from,
    to,
    minAmountPaise,
    maxAmountPaise,
    sort,
    page,
    pageSize,
  }
}

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

  const matches = source.filter((order) => {
    if (
      search &&
      ![order.id, order.customer.name, order.customer.email].some((value) =>
        value.toLowerCase().includes(search),
      )
    )
      return false
    if (query.status && order.status !== query.status) return false
    const time = Date.parse(order.placedAt)
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
      ? Date.parse(a.placedAt) - Date.parse(b.placedAt)
      : a.totalAmountPaise - b.totalAmountPaise
    return (
      (query.sort.endsWith("desc") ? -difference : difference) ||
      a.id.localeCompare(b.id)
    )
  })

  const start = (query.page - 1) * query.pageSize
  return {
    data: matches.slice(start, start + query.pageSize).map(summary),
    total: matches.length,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(matches.length / query.pageSize),
  }
}
