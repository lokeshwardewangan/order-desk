import { delay, http, HttpResponse } from "msw"
import { orders } from "./data"
import type { ApiErrorResponse } from "../../features/orders/order-api.types"
import {
  InvalidOrderQuery,
  parseOrderQuery,
} from "../../features/orders/schemas/order-query.schema"
import { queryOrders } from "./query-orders"

export const MIN_LATENCY_MS = 200
export const MAX_LATENCY_MS = 3_000
export const FAILURE_RATE = 0.1

interface NetworkOptions {
  random?: () => number
  wait?: (milliseconds: number) => Promise<void>
}

function errorResponse(status: number, error: ApiErrorResponse["error"]) {
  return HttpResponse.json<ApiErrorResponse>({ error }, { status })
}

const orderById = new Map(orders.map((order) => [order.id, order]))
export function createOrderHandlers({
  random = Math.random,
  wait = delay,
}: NetworkOptions = {}) {
  async function simulateNetwork() {
    const milliseconds =
      MIN_LATENCY_MS +
      Math.floor(random() * (MAX_LATENCY_MS - MIN_LATENCY_MS + 1))
    const failed = random() < FAILURE_RATE
    await wait(milliseconds)
    return failed
  }

  const unavailable = () =>
    errorResponse(503, {
      code: "TEMPORARY_FAILURE",
      message: "The orders service is temporarily unavailable. Please retry.",
    })

  return [
    http.get("*/api/orders", async ({ request }) => {
      if (await simulateNetwork()) return unavailable()
      try {
        const query = parseOrderQuery(new URL(request.url).searchParams)
        return HttpResponse.json(queryOrders(orders, query))
      } catch (error) {
        if (error instanceof InvalidOrderQuery) {
          return errorResponse(400, {
            code: "INVALID_QUERY",
            message: error.message,
            fields: error.fields,
          })
        }
        throw error
      }
    }),
    http.get("*/api/orders/:id", async ({ params }) => {
      if (await simulateNetwork()) return unavailable()
      const order =
        typeof params.id === "string" ? orderById.get(params.id) : undefined
      if (!order)
        return errorResponse(404, {
          code: "NOT_FOUND",
          message: "This order could not be found.",
        })
      return HttpResponse.json({ data: order })
    }),
  ]
}

export const handlers = createOrderHandlers()
