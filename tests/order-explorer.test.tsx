// @vitest-environment jsdom
import { orders } from "../src/mocks/orders/data"
import { queryOrders } from "../src/mocks/orders/query-orders"
import { parseOrderQuery } from "../src/features/orders/schemas/order-query.schema"
import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { createOrderHandlers } from "../src/mocks/orders/handlers"
import { OrderExplorer } from "../src/features/orders/order-explorer"
const server = setupServer(
  ...createOrderHandlers({ random: () => 0.5, wait: async () => {} }),
)
beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  server.resetHandlers()
})
afterAll(() => server.close())
function Location() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output aria-label="Current URL">{location.search}</output>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  )
}
function mount(url = "/orders") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Location />
        <OrderExplorer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
test("restores URL filters and pagination, and resets page when applying search", async () => {
  const user = userEvent.setup()
  mount("/orders?status=processing&page=2")
  expect(screen.getByLabelText("Status")).toHaveValue("processing")
  await screen.findByText(/Page 2 of/)
  expect(screen.getByText(/Showing 101–200/)).toBeInTheDocument()
  await user.type(screen.getByLabelText("Search orders"), "ORD-00001")
  await user.click(screen.getByRole("button", { name: "Apply filters" }))
  await waitFor(() =>
    expect(screen.getByLabelText("Current URL").textContent).toContain(
      "q=ORD-00001",
    ),
  )
  expect(screen.getByLabelText("Current URL").textContent).not.toContain(
    "page=",
  )
  await user.click(screen.getByRole("button", { name: "Back", exact: true }))
  await screen.findByText(/Page 2 of/)
  expect(screen.getByLabelText("Search orders")).toHaveValue("")
})
test("sort and pagination update the URL", async () => {
  const user = userEvent.setup()
  mount()
  await screen.findByText("Page 1 of 100")
  await user.click(screen.getByRole("button", { name: "Next", exact: true }))
  await screen.findByText("Page 2 of 100")
  expect(screen.getByLabelText("Current URL")).toHaveTextContent("page=2")
  await user.click(screen.getByRole("button", { name: "Sort by order amount" }))
  await screen.findByText("Page 1 of 100")
  expect(screen.getByLabelText("Current URL")).toHaveTextContent(
    "sort=amount-desc",
  )
})
test("invalid amount range stays local and focuses the error field", async () => {
  const user = userEvent.setup()
  mount()
  await screen.findByText("Page 1 of 100")
  await user.type(screen.getByLabelText("Min amount (₹)"), "100")
  await user.type(screen.getByLabelText("Max amount (₹)"), "50")
  await user.click(screen.getByRole("button", { name: "Apply filters" }))
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Maximum amount must be at least",
  )
  expect(screen.getByLabelText("Max amount (₹)")).toHaveFocus()
  expect(screen.getByLabelText("Current URL").textContent).toBe("")
})
test("shows an error and retries the same view", async () => {
  server.use(
    http.get(
      "*/api/orders",
      () =>
        HttpResponse.json(
          { error: { code: "TEMPORARY_FAILURE", message: "Please try again" } },
          { status: 503 },
        ),
      { once: true },
    ),
  )
  const user = userEvent.setup()
  mount()
  expect(await screen.findByRole("alert")).toHaveTextContent("Please try again")
  await user.click(screen.getByRole("button", { name: "Retry" }))
  await screen.findByText("Page 1 of 100")
})
test("shows an empty result instead of stale rows", async () => {
  mount("/orders?q=no-such-customer")
  await screen.findByText(
    "No orders match these filters. Try changing or clearing them.",
  )
  expect(screen.queryByText("ORD-00001")).not.toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled()
})

test("clear all also clears unapplied edits", async () => {
  const user = userEvent.setup()
  mount()
  await user.type(screen.getByLabelText("Search orders"), "unsaved search")
  await user.click(screen.getByRole("button", { name: "Clear all" }))
  expect(screen.getByLabelText("Search orders")).toHaveValue("")
})

test("applying filters preserves the search input and its focus", async () => {
  const user = userEvent.setup()
  mount()
  const input = screen.getByLabelText("Search orders")
  await user.type(input, "ORD-00001{Enter}")
  await waitFor(() =>
    expect(screen.getByLabelText("Current URL")).toHaveTextContent(
      "q=ORD-00001",
    ),
  )
  expect(screen.getByLabelText("Search orders")).toBe(input)
  expect(input).toHaveFocus()
})

test.each([false, true])(
  "a late previous response cannot replace current results (failure: %s)",
  async (fails) => {
    let previousSignal: AbortSignal | undefined
    const originalFetch = globalThis.fetch
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (String(input).includes("q=ORD-00001"))
        previousSignal = init?.signal ?? undefined
      return originalFetch(input, init)
    })
    let releasePrevious!: () => void
    let finishPrevious!: () => void
    const previousFinished = new Promise<void>((resolve) => {
      finishPrevious = resolve
    })
    server.use(
      http.get("*/api/orders", async ({ request }) => {
        const query = parseOrderQuery(new URL(request.url).searchParams)
        if (query.q === "ORD-00001") {
          await new Promise<void>((resolve) => {
            releasePrevious = resolve
          })
          finishPrevious()
          if (fails)
            return HttpResponse.json(
              {
                error: {
                  code: "TEMPORARY_FAILURE",
                  message: "Old request failed",
                },
              },
              { status: 503 },
            )
        }
        return HttpResponse.json(queryOrders(orders, query))
      }),
    )
    const user = userEvent.setup()
    mount()
    const input = screen.getByLabelText("Search orders")
    await user.type(input, "ORD-00001")
    await waitFor(() => expect(releasePrevious).toBeDefined())
    await user.clear(input)
    await user.type(input, "ORD-00002")
    await waitFor(() =>
      expect(screen.getByLabelText("Current URL")).toHaveTextContent(
        "q=ORD-00002",
      ),
    )
    await screen.findByText("ORD-00002")
    await waitFor(() => expect(previousSignal?.aborted).toBe(true))
    await act(async () => {
      releasePrevious()
      await previousFinished
    })
    expect(screen.getByText("ORD-00002")).toBeInTheDocument()
    expect(screen.queryByText("ORD-00001")).not.toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  },
)

test("restores scroll from a shared URL and resets it on the next page", async () => {
  mount("/orders?page=2&scroll=1520")
  await screen.findByText("Page 2 of 100")
  const viewport = screen.getByRole("region", { name: "Scrollable orders" })
  expect(viewport.scrollTop).toBe(1520)
  fireEvent.click(screen.getByRole("button", { name: "Next", exact: true }))
  await screen.findByText("Page 3 of 100")
  expect(
    screen.getByRole("region", { name: "Scrollable orders" }).scrollTop,
  ).toBe(0)
  expect(screen.getByLabelText("Current URL")).not.toHaveTextContent("scroll=")
})
test("scroll updates replace history and do not request another page", async () => {
  let requests = 0
  server.use(
    http.get("*/api/orders", ({ request }) => {
      requests++
      return HttpResponse.json(
        queryOrders(orders, parseOrderQuery(new URL(request.url).searchParams)),
      )
    }),
  )
  mount()
  await screen.findByText("Page 1 of 100")
  fireEvent.click(screen.getByRole("button", { name: "Next", exact: true }))
  await screen.findByText("Page 2 of 100")
  fireEvent.scroll(screen.getByRole("region", { name: "Scrollable orders" }), {
    target: { scrollTop: 1520 },
  })
  await waitFor(() =>
    expect(screen.getByLabelText("Current URL")).toHaveTextContent(
      "scroll=1520",
    ),
  )
  expect(requests).toBe(2)
  fireEvent.click(screen.getByRole("button", { name: "Back", exact: true }))
  await screen.findByText("Page 1 of 100")
})

test("collapsed range filters retain drafts and reopen on validation errors", async () => {
  const user = userEvent.setup()
  mount()
  await screen.findByText("Page 1 of 100")
  const toggle = screen.getByRole("button", { name: "Date & amount filters" })
  await user.click(toggle)
  expect(toggle).toHaveAttribute("aria-expanded", "true")
  await user.type(screen.getByLabelText("Min amount (₹)"), "100")
  await user.type(screen.getByLabelText("Max amount (₹)"), "50")
  await user.click(toggle)
  expect(toggle).toHaveAttribute("aria-expanded", "false")
  await user.click(screen.getByRole("button", { name: "Apply filters" }))
  expect(toggle).toHaveAttribute("aria-expanded", "true")
  expect(screen.getByLabelText("Min amount (₹)")).toHaveValue(100)
  expect(screen.getByLabelText("Max amount (₹)")).toHaveFocus()
  expect(screen.getByLabelText("Current URL").textContent).toBe("")
})

test("preset selection follows applied URL criteria and clears for a custom view", async () => {
  mount("/orders?status=processing&page=2")
  const processing = screen.getByRole("button", {
    name: "Processing",
    exact: true,
  })
  expect(processing).toHaveAttribute("aria-pressed", "true")
  expect(
    screen.getByRole("button", { name: "All orders", exact: true }),
  ).toHaveAttribute("aria-pressed", "false")
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Search orders"), "ORD-00001{Enter}")
  await waitFor(() =>
    expect(processing).toHaveAttribute("aria-pressed", "false"),
  )
})
