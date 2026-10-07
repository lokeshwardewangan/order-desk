import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, ORDER_SORTS } from "./api-types"
import type { OrderListQuery, OrderSort } from "./api-types"
import { ORDER_STATUSES } from "./types"
import type { OrderStatus } from "./types"

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
