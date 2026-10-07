import type { OrderStatus, OrderSummary } from "./types"

export const ORDER_SORTS = [
  "date-desc",
  "date-asc",
  "amount-desc",
  "amount-asc",
] as const
export type OrderSort = (typeof ORDER_SORTS)[number]

export const DEFAULT_PAGE_SIZE = 100
export const MAX_PAGE_SIZE = 1_000

export interface OrderListQuery {
  q: string
  status?: OrderStatus
  from?: string
  to?: string
  minAmountPaise?: number
  maxAmountPaise?: number
  sort: OrderSort
  page: number
  pageSize: number
}

export interface OrderListResponse {
  data: OrderSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiErrorResponse {
  error: {
    code: "INVALID_QUERY" | "NOT_FOUND" | "TEMPORARY_FAILURE"
    message: string
    fields?: Record<string, string>
  }
}
