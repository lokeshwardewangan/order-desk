import { describe, expect, it } from "vitest"
import { parseOrderQuery } from "../src/features/orders/schemas/order-query.schema"
import {
  orderListSearchParams,
  orderViewSearchParams,
  orderViewUrl,
  readOrderViewState,
  updateOrderViewState,
} from "../src/features/orders/utils/order-url"

const detailedView =
  "q=Rahul&status=shipped&from=2026-10-01&to=2026-10-07&minAmountPaise=0&maxAmountPaise=3000000&sort=amount-desc&page=3&pageSize=50&order=ORD-01042&scroll=840"

function currentView() {
  return readOrderViewState(detailedView)
}

describe("reading and sharing order URLs", () => {
  it("uses list defaults for an empty URL", () => {
    expect(readOrderViewState("")).toEqual({
      q: "",
      status: undefined,
      from: undefined,
      to: undefined,
      minAmountPaise: undefined,
      maxAmountPaise: undefined,
      sort: "date-desc",
      page: 1,
      pageSize: 100,
      order: undefined,
      scroll: 0,
    })
    expect(orderViewUrl(readOrderViewState(""))).toBe("/orders")
  })

  it("round-trips every filter, list position, and the selected order", () => {
    const state = currentView()
    expect(state).toMatchObject({
      q: "Rahul",
      status: "shipped",
      from: "2026-10-01",
      to: "2026-10-07",
      minAmountPaise: 0,
      maxAmountPaise: 3_000_000,
      sort: "amount-desc",
      page: 3,
      pageSize: 50,
      order: "ORD-01042",
      scroll: 840,
    })
    expect(readOrderViewState(orderViewSearchParams(state))).toEqual(state)
    expect(orderViewUrl(state)).toBe("/orders?" + detailedView)
  })

  it("safely encodes search text containing spaces, symbols, and Unicode", () => {
    const state = updateOrderViewState(readOrderViewState(""), {
      q: "Asha & Meera + café / #1",
    })
    const url = new URL(orderViewUrl(state), "https://example.com")
    expect(readOrderViewState(url.search).q).toBe(state.q)
    expect(url.hash).toBe("")
    expect(url.searchParams.get("q")).toBe(state.q)
  })

  it("omits defaults and ignores unrelated parameters", () => {
    const state = readOrderViewState(
      "q=+Rahul+&status=all&sort=date-desc&page=1&pageSize=100&scroll=0&utm_source=demo",
    )
    expect(orderViewUrl(state)).toBe("/orders?q=Rahul")
  })

  it("does not mutate supplied URLSearchParams", () => {
    const input = new URLSearchParams("status=unknown&page=0")
    const before = input.toString()
    readOrderViewState(input)
    expect(input.toString()).toBe(before)
  })

  it("retains a syntactically valid missing order so the detail API can return 404", () => {
    expect(readOrderViewState("order=ORD-99999").order).toBe("ORD-99999")
  })

  it.each(["invalid", "ORD-1", "ORD-01042/other", "<script>"])(
    "ignores invalid selected order %s",
    (order) => {
      const state = readOrderViewState(
        "status=shipped&page=2&order=" + encodeURIComponent(order),
      )
      expect(state.order).toBeUndefined()
      expect(state.status).toBe("shipped")
      expect(state.page).toBe(2)
    },
  )

  it("recovers invalid filters while preserving unrelated valid filters", () => {
    const state = readOrderViewState(
      "q=Rahul&status=shipped&sort=invalid&from=2026-02-30&page=5&scroll=900",
    )
    expect(state).toMatchObject({
      q: "Rahul",
      status: "shipped",
      sort: "date-desc",
      from: undefined,
      page: 1,
      scroll: 0,
    })
    expect(() => parseOrderQuery(orderListSearchParams(state))).not.toThrow()
  })

  it("recovers reversed ranges without discarding the valid lower bound", () => {
    const state = readOrderViewState(
      "from=2026-10-07&to=2026-10-01&minAmountPaise=500&maxAmountPaise=100",
    )
    expect(state).toMatchObject({
      from: "2026-10-07",
      to: undefined,
      minAmountPaise: 500,
      maxAmountPaise: undefined,
    })
  })

  it.each(["0", "-1", "1.5", "9007199254740991"])(
    "recovers invalid page %s and resets its scroll",
    (page) => {
      const state = readOrderViewState(
        "status=shipped&page=" + page + "&scroll=840",
      )
      expect(state).toMatchObject({ status: "shipped", page: 1, scroll: 0 })
    },
  )

  it.each(["-10", "1.5", "Infinity", "9007199254740992"])(
    "ignores invalid scroll %s",
    (scroll) => {
      expect(readOrderViewState("page=3&scroll=" + scroll)).toMatchObject({
        page: 3,
        scroll: 0,
      })
    },
  )
})

describe("updating the order view", () => {
  it.each([
    { q: "Asha" },
    { status: "delivered" as const },
    { from: "2026-10-02" },
    { to: "2026-10-06" },
    { minAmountPaise: 100 },
    { maxAmountPaise: 2_000_000 },
    { sort: "date-asc" as const },
    { pageSize: 100 },
  ])(
    "resets page, scroll, and selection when criteria change: %j",
    (changes) => {
      const current = currentView()
      const next = updateOrderViewState(current, { ...changes, page: 5 })
      expect(next).toMatchObject({
        ...changes,
        page: 1,
        scroll: 0,
        order: undefined,
      })
      expect(current).toEqual(currentView())
    },
  )

  it("preserves the list when opening and closing details", () => {
    const initial = currentView()
    const closed = updateOrderViewState(initial, { order: undefined })
    expect(closed).toEqual({ ...initial, order: undefined })
    const reopened = updateOrderViewState(closed, { order: "ORD-01042" })
    expect(reopened).toEqual(initial)
  })

  it("resets scroll and closes details when changing page, keeping filters", () => {
    const current = currentView()
    expect(updateOrderViewState(current, { page: 4 })).toEqual({
      ...current,
      page: 4,
      scroll: 0,
      order: undefined,
    })
  })

  it("does not reset the view when criteria are unchanged", () => {
    const current = currentView()
    expect(
      updateOrderViewState(current, { q: "  Rahul  ", status: "shipped" }),
    ).toEqual(current)
  })

  it("removes a filter explicitly and resets the page", () => {
    expect(
      updateOrderViewState(currentView(), { status: undefined }),
    ).toMatchObject({ status: undefined, q: "Rahul", page: 1, scroll: 0 })
  })

  it("keeps drawer and scroll state out of list API parameters", () => {
    const state = currentView()
    const params = orderListSearchParams(state)
    expect(params.has("order")).toBe(false)
    expect(params.has("scroll")).toBe(false)
    expect(parseOrderQuery(params)).toEqual({
      q: state.q,
      status: state.status,
      from: state.from,
      to: state.to,
      minAmountPaise: state.minAmountPaise,
      maxAmountPaise: state.maxAmountPaise,
      sort: state.sort,
      page: state.page,
      pageSize: state.pageSize,
    })
    expect(
      orderListSearchParams(
        updateOrderViewState(state, { order: undefined, scroll: 1_000 }),
      ).toString(),
    ).toBe(params.toString())
  })
})
