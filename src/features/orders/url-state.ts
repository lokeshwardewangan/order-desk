import { DEFAULT_PAGE_SIZE } from "./api-types"
import type { OrderListQuery } from "./api-types"
import { InvalidOrderQuery, parseOrderQuery } from "./query"

export interface OrderViewState extends OrderListQuery {
  order?: string
  scroll: number
}

const criteriaKeys = [
  "q",
  "status",
  "from",
  "to",
  "minAmountPaise",
  "maxAmountPaise",
  "sort",
  "pageSize",
] as const

export function readOrderViewState(
  input: string | URLSearchParams,
): OrderViewState {
  const params = new URLSearchParams(input)
  let query: OrderListQuery

  while (true) {
    try {
      query = parseOrderQuery(params)
      break
    } catch (error) {
      if (!(error instanceof InvalidOrderQuery)) throw error
      for (const key of Object.keys(error.fields)) params.delete(key)
      if ("page" in error.fields) params.delete("scroll")
      if (criteriaKeys.some((key) => key in error.fields)) {
        params.delete("page")
        params.delete("scroll")
      }
    }
  }

  const selectedOrder = params.get("order")
  const rawScroll = params.get("scroll")
  const scroll = rawScroll && /^\d+$/.test(rawScroll) ? Number(rawScroll) : 0

  return {
    ...query,
    order:
      selectedOrder && /^ORD-\d{5}$/.test(selectedOrder)
        ? selectedOrder
        : undefined,
    scroll: Number.isSafeInteger(scroll) && scroll >= 0 ? scroll : 0,
  }
}

export function orderListSearchParams(query: OrderListQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q.trim()) params.set("q", query.q.trim())
  if (query.status) params.set("status", query.status)
  if (query.from) params.set("from", query.from)
  if (query.to) params.set("to", query.to)
  if (query.minAmountPaise !== undefined)
    params.set("minAmountPaise", String(query.minAmountPaise))
  if (query.maxAmountPaise !== undefined)
    params.set("maxAmountPaise", String(query.maxAmountPaise))
  if (query.sort !== "date-desc") params.set("sort", query.sort)
  if (query.page !== 1) params.set("page", String(query.page))
  if (query.pageSize !== DEFAULT_PAGE_SIZE)
    params.set("pageSize", String(query.pageSize))
  return params
}

export function orderViewSearchParams(state: OrderViewState): URLSearchParams {
  const params = orderListSearchParams(state)
  if (state.order) params.set("order", state.order)
  if (state.scroll > 0) params.set("scroll", String(state.scroll))
  return params
}

export function orderViewUrl(state: OrderViewState): string {
  const search = orderViewSearchParams(state).toString()
  return "/orders" + (search ? "?" + search : "")
}

export function updateOrderViewState(
  current: OrderViewState,
  changes: Partial<OrderViewState>,
): OrderViewState {
  const next = readOrderViewState(
    orderViewSearchParams({ ...current, ...changes }),
  )
  const criteriaChanged = criteriaKeys.some((key) => next[key] !== current[key])
  const pageChanged = next.page !== current.page

  if (criteriaChanged || pageChanged) {
    if (criteriaChanged) next.page = 1
    next.scroll = 0
    next.order = undefined
  }

  return next
}
