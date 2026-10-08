export const ORDER_STATUSES = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const
export const ORDER_SORTS = [
  "date-desc",
  "date-asc",
  "amount-desc",
  "amount-asc",
] as const
export const DEFAULT_PAGE_SIZE = 100
export const MAX_PAGE_SIZE = 1_000
