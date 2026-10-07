import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import { setupServer } from "msw/node"
import { orders } from "../src/features/orders/data"
import type {
  ApiErrorResponse,
  OrderListResponse,
} from "../src/features/orders/api-types"
import type { Order } from "../src/features/orders/types"
import {
  createOrderHandlers,
  MAX_LATENCY_MS,
  MIN_LATENCY_MS,
} from "../src/mocks/handlers"
import { parseOrderQuery, queryOrders } from "../src/mocks/orders-query"

const random = vi.fn(() => 0.5)
const wait = vi.fn(async (_milliseconds: number) => {})
const server = setupServer(...createOrderHandlers({ random, wait }))
const base = "http://localhost/api/orders"

beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
afterEach(() => {
  server.resetHandlers()
  random.mockReset().mockReturnValue(0.5)
  wait.mockClear()
})
afterAll(() => server.close())

async function list(query = ""): Promise<OrderListResponse> {
  const response = await fetch(base + query)
  expect(response.status).toBe(200)
  return response.json()
}

describe("orders list API", () => {
  it("returns 100 summaries from 10,000 orders, newest first", async () => {
    const result = await list()
    expect(result).toMatchObject({
      total: 10_000,
      page: 1,
      pageSize: 100,
      totalPages: 100,
    })
    expect(result.data).toHaveLength(100)
    for (const order of result.data) {
      expect(order).not.toHaveProperty("items")
      expect(order).not.toHaveProperty("shippingAddress")
      expect(order).not.toHaveProperty("timeline")
    }
    for (let index = 1; index < result.data.length; index++) {
      expect(
        Date.parse(result.data[index - 1].placedAt),
      ).toBeGreaterThanOrEqual(Date.parse(result.data[index].placedAt))
    }
  })

  it.each([
    ["id", () => orders[0].id],
    ["name", () => orders[0].customer.name],
    ["email", () => orders[0].customer.email],
  ])(
    "searches %s without case or surrounding whitespace sensitivity",
    async (_field, value) => {
      const result = await list(
        "?q=" + encodeURIComponent("  " + value().toUpperCase() + "  "),
      )
      expect(result.data.some((order) => order.id === orders[0].id)).toBe(true)
      expect(result.total).toBeGreaterThan(0)
    },
  )

  it("applies search, status, dates, and amount filters together before pagination", async () => {
    const result = await list(
      "?q=rahul&status=shipped&from=2026-04-01&to=2026-10-07&minAmountPaise=1000000&maxAmountPaise=3000000&pageSize=5&sort=amount-desc",
    )
    const expected = orders.filter(
      (order) =>
        order.customer.name.toLowerCase().includes("rahul") &&
        order.status === "shipped" &&
        Date.parse(order.placedAt) >= Date.parse("2026-04-01T00:00:00+05:30") &&
        Date.parse(order.placedAt) <=
          Date.parse("2026-10-07T23:59:59.999+05:30") &&
        order.totalAmountPaise >= 1_000_000 &&
        order.totalAmountPaise <= 3_000_000,
    )
    expect(expected.length).toBeGreaterThan(5)
    expect(result.total).toBe(expected.length)
    expect(result.data).toHaveLength(5)
    expect(
      result.data.every((order) =>
        expected.some((match) => match.id === order.id),
      ),
    ).toBe(true)
    for (let index = 1; index < result.data.length; index++) {
      expect(result.data[index - 1].totalAmountPaise).toBeGreaterThanOrEqual(
        result.data[index].totalAmountPaise,
      )
    }
  })

  it.each(["date-asc", "date-desc", "amount-asc", "amount-desc"])(
    "sorts globally using %s",
    async (sort) => {
      const result = await list("?sort=" + sort)
      const values = result.data.map((order) =>
        sort.startsWith("date")
          ? Date.parse(order.placedAt)
          : order.totalAmountPaise,
      )
      const globalValues = orders.map((order) =>
        sort.startsWith("date")
          ? Date.parse(order.placedAt)
          : order.totalAmountPaise,
      )
      expect(values[0]).toBe(
        sort.endsWith("asc")
          ? Math.min(...globalValues)
          : Math.max(...globalValues),
      )
      for (let index = 1; index < values.length; index++) {
        if (sort.endsWith("asc"))
          expect(values[index - 1]).toBeLessThanOrEqual(values[index])
        else expect(values[index - 1]).toBeGreaterThanOrEqual(values[index])
      }
    },
  )

  it("returns disjoint, stable adjacent pages and does not reorder the dataset", async () => {
    const originalIds = orders.map((order) => order.id)
    const first = await list("?sort=amount-desc&pageSize=17")
    const second = await list("?sort=amount-desc&pageSize=17&page=2")
    expect(second.data).toHaveLength(17)
    const ids = [...first.data, ...second.data].map((order) => order.id)
    expect(new Set(ids).size).toBe(34)
    expect(await list("?sort=amount-desc&pageSize=17&page=2")).toEqual(second)
    expect(orders.map((order) => order.id)).toEqual(originalIds)
  })

  it("handles the final partial page and pages beyond the results", async () => {
    const last = await list("?pageSize=300&page=34")
    expect(last.data).toHaveLength(100)
    expect(last.totalPages).toBe(34)
    expect(await list("?pageSize=300&page=35")).toMatchObject({
      data: [],
      total: 10_000,
      totalPages: 34,
      page: 35,
    })
  })

  it("returns an honest empty result with no matching orders", async () => {
    expect(await list("?q=does-not-exist")).toMatchObject({
      data: [],
      total: 0,
      totalPages: 0,
    })
  })

  it.each([
    ["status=unknown", "status"],
    ["sort=unknown", "sort"],
    ["page=0", "page"],
    ["page=1.5", "page"],
    ["pageSize=1001", "pageSize"],
    ["pageSize=0", "pageSize"],
    ["page=9007199254740991", "page"],
    ["from=2026-02-30", "from"],
    ["to=invalid", "to"],
    ["from=2026-10-07&to=2026-10-01", "to"],
    ["minAmountPaise=-1", "minAmountPaise"],
    ["minAmountPaise=100&maxAmountPaise=50", "maxAmountPaise"],
  ])("rejects invalid query %s with a field error", async (query, field) => {
    const response = await fetch(base + "?" + query)
    expect(response.status).toBe(400)
    const body: ApiErrorResponse = await response.json()
    expect(body.error.code).toBe("INVALID_QUERY")
    expect(body.error.fields).toHaveProperty(field)
  })
})

describe("sorting and filter boundaries", () => {
  it("includes the entire selected calendar day in India", () => {
    const fixture = [
      { ...orders[0], id: "ORD-00001", placedAt: "2026-10-06T18:29:59.999Z" },
      { ...orders[0], id: "ORD-00002", placedAt: "2026-10-06T18:30:00.000Z" },
      { ...orders[0], id: "ORD-00003", placedAt: "2026-10-07T18:29:59.999Z" },
      { ...orders[0], id: "ORD-00004", placedAt: "2026-10-07T18:30:00.000Z" },
    ]
    const result = queryOrders(
      fixture,
      parseOrderQuery(
        new URLSearchParams("from=2026-10-07&to=2026-10-07&sort=date-asc"),
      ),
    )
    expect(result.data.map((order) => order.id)).toEqual([
      "ORD-00002",
      "ORD-00003",
    ])
  })

  it("uses IDs to break equal-value ties consistently", () => {
    const fixture = ["ORD-00003", "ORD-00001", "ORD-00002"].map((id) => ({
      ...orders[0],
      id,
    }))
    for (const sort of ["date-asc", "date-desc", "amount-asc", "amount-desc"]) {
      const query = parseOrderQuery(
        new URLSearchParams("sort=" + sort + "&pageSize=2"),
      )
      expect(queryOrders(fixture, query).data.map((order) => order.id)).toEqual(
        ["ORD-00001", "ORD-00002"],
      )
      expect(
        queryOrders(fixture, { ...query, page: 2 }).data.map(
          (order) => order.id,
        ),
      ).toEqual(["ORD-00003"])
    }
  })

  it("includes both amount boundaries", () => {
    const fixture = [99, 100, 200, 201].map((amount, index) => ({
      ...orders[0],
      id: "ORD-0000" + (index + 1),
      totalAmountPaise: amount,
    }))
    const result = queryOrders(
      fixture,
      parseOrderQuery(
        new URLSearchParams(
          "minAmountPaise=100&maxAmountPaise=200&sort=amount-asc",
        ),
      ),
    )
    expect(result.data.map((order) => order.totalAmountPaise)).toEqual([
      100, 200,
    ])
  })
})

describe("order detail API and network conditions", () => {
  it("returns full details for a direct order link", async () => {
    const response = await fetch(base + "/" + orders[0].id)
    expect(response.status).toBe(200)
    const body: { data: Order } = await response.json()
    expect(body.data).toEqual(orders[0])
  })

  it("returns 404 for an unknown order", async () => {
    const response = await fetch(base + "/ORD-99999")
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({
      error: { code: "NOT_FOUND" },
    })
  })

  it("requests delays at both ends of the required latency range", async () => {
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.5)
    await list()
    expect(wait).toHaveBeenLastCalledWith(MIN_LATENCY_MS)
    random.mockReturnValueOnce(0.999999).mockReturnValueOnce(0.5)
    await list()
    expect(wait).toHaveBeenLastCalledWith(MAX_LATENCY_MS)
  })

  it("fails below the 10% threshold and succeeds when retried above it", async () => {
    random.mockReturnValueOnce(0.5).mockReturnValueOnce(0.099)
    const failed = await fetch(base)
    expect(failed.status).toBe(503)
    expect(await failed.json()).toMatchObject({
      error: { code: "TEMPORARY_FAILURE" },
    })
    random.mockReturnValueOnce(0.5).mockReturnValueOnce(0.1)
    expect((await list()).total).toBe(10_000)
  })

  it("allows details to fail independently of a successful list", async () => {
    await list()
    random.mockReturnValueOnce(0.5).mockReturnValueOnce(0)
    const response = await fetch(base + "/" + orders[0].id)
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      error: { code: "TEMPORARY_FAILURE" },
    })
    expect((await list()).data).toHaveLength(100)
  })
})
