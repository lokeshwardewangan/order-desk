// @vitest-environment jsdom
import { orders } from "../src/mocks/orders/data"
import { afterAll, afterEach, beforeAll, expect, test } from "vitest"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import {
  fetchOrders,
  fetchOrder,
  OrdersApiError,
} from "../src/features/orders/services/orders-api"
import { parseOrderQuery } from "../src/features/orders/schemas/order-query.schema"
import { createOrderHandlers } from "../src/mocks/orders/handlers"
const server = setupServer(
  ...createOrderHandlers({ random: () => 0.5, wait: async () => {} }),
)
beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
const query = () => parseOrderQuery(new URLSearchParams())
test("validates successful mock API responses", async () => {
  const result = await fetchOrders(query(), new AbortController().signal)
  expect(result.data).toHaveLength(100)
  expect(result.total).toBe(10_000)
})
test.each([
  {
    data: [{ id: "ORD-00001" }],
    total: 1,
    page: 1,
    pageSize: 100,
    totalPages: 1,
  },
  { data: [], total: 100, page: 1, pageSize: 100, totalPages: 10 },
])("rejects malformed successful responses", async (body) => {
  server.use(http.get("*/api/orders", () => HttpResponse.json(body)))
  await expect(
    fetchOrders(query(), new AbortController().signal),
  ).rejects.toThrow("invalid response")
})
test("retains HTTP status, API code and field errors", async () => {
  server.use(
    http.get("*/api/orders", () =>
      HttpResponse.json(
        {
          error: {
            code: "INVALID_QUERY",
            message: "Check filters",
            fields: { to: "Invalid date range" },
          },
        },
        { status: 400 },
      ),
    ),
  )
  await expect(
    fetchOrders(query(), new AbortController().signal),
  ).rejects.toMatchObject({
    name: "OrdersApiError",
    status: 400,
    code: "INVALID_QUERY",
    fields: { to: "Invalid date range" },
    message: "Check filters",
  })
})
test.each([200, 503])(
  "handles a non-JSON response with status %s",
  async (status) => {
    server.use(
      http.get(
        "*/api/orders",
        () =>
          new HttpResponse("<html>Service unavailable</html>", {
            status,
            headers: { "Content-Type": "text/html" },
          }),
      ),
    )
    await expect(
      fetchOrders(query(), new AbortController().signal),
    ).rejects.toBeInstanceOf(OrdersApiError)
  },
)
test("preserves request cancellation", async () => {
  const controller = new AbortController()
  controller.abort()
  await expect(fetchOrders(query(), controller.signal)).rejects.toMatchObject({
    name: "AbortError",
  })
})

test("validates complete order details", async () => {
  expect(await fetchOrder("ORD-00001", new AbortController().signal)).toEqual({
    data: orders[0],
  })
})
test.each([
  { ...orders[0], totalAmountPaise: orders[0].totalAmountPaise + 1 },
  { ...orders[0], id: "ORD-00002" },
  { ...orders[0], shippingAddress: undefined },
])("rejects inconsistent or incomplete details", async (order) => {
  server.use(
    http.get("*/api/orders/ORD-00001", () =>
      HttpResponse.json({ data: order }),
    ),
  )
  await expect(
    fetchOrder("ORD-00001", new AbortController().signal),
  ).rejects.toThrow("invalid response")
})
