import type { OrderListQuery } from "../order-api.types"
import {
  InvalidOrderQuery,
  parseOrderQuery,
} from "../schemas/order-query.schema"
import { orderListSearchParams } from "./order-url"
export const FILTER_KEYS = [
  "q",
  "status",
  "from",
  "to",
  "minAmountPaise",
  "maxAmountPaise",
] as const
export type FilterKey = (typeof FILTER_KEYS)[number]
export type FilterDraft = Record<FilterKey, string>
export const FILTER_INPUT_IDS: Record<FilterKey, string> = {
  q: "order-search",
  status: "order-status",
  from: "order-from",
  to: "order-to",
  minAmountPaise: "order-min",
  maxAmountPaise: "order-max",
}
export function draftFrom(query: OrderListQuery): FilterDraft {
  return {
    q: query.q,
    status: query.status ?? "all",
    from: query.from ?? "",
    to: query.to ?? "",
    minAmountPaise:
      query.minAmountPaise === undefined
        ? ""
        : String(query.minAmountPaise / 100),
    maxAmountPaise:
      query.maxAmountPaise === undefined
        ? ""
        : String(query.maxAmountPaise / 100),
  }
}
export function filterDraftKey(query: OrderListQuery) {
  return JSON.stringify(draftFrom(query))
}
export function parseFilterDraft(draft: FilterDraft, current: OrderListQuery) {
  const params = orderListSearchParams(current)
  const errors: Record<string, string> = {}
  for (const key of FILTER_KEYS) {
    let value = draft[key].trim()
    if ((key === "minAmountPaise" || key === "maxAmountPaise") && value) {
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        errors[key] = "Enter a nonnegative amount with up to two decimal places"
        params.delete(key)
        continue
      }
      const [whole, decimal = ""] = value.split(".")
      value = String(Number(whole) * 100 + Number(decimal.padEnd(2, "0")))
    }
    if (value) params.set(key, value)
    else params.delete(key)
  }
  let query: OrderListQuery | undefined
  try {
    query = parseOrderQuery(params)
  } catch (error) {
    if (!(error instanceof InvalidOrderQuery)) throw error
    Object.assign(errors, error.fields)
  }
  if (Object.keys(errors).length) throw new InvalidOrderQuery(errors)
  return query!
}
export function activeFilterChips(query: OrderListQuery) {
  const labels: Record<FilterKey, string> = {
    q: "Search",
    status: "Status",
    from: "From",
    to: "To",
    minAmountPaise: "Min",
    maxAmountPaise: "Max",
  }
  return FILTER_KEYS.filter(
    (key) => query[key] !== undefined && query[key] !== "",
  ).map((key) => ({
    id: key,
    label:
      labels[key] +
      ": " +
      (key === "minAmountPaise" || key === "maxAmountPaise"
        ? "₹" + Number(query[key]) / 100
        : query[key]),
  }))
}
