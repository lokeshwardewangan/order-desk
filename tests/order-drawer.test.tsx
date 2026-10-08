// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"
import { createOrderHandlers } from "../src/mocks/orders/handlers"
import { OrderExplorer } from "../src/features/orders/order-explorer"
import { orders } from "../src/mocks/orders/data"
const server = setupServer(
  ...createOrderHandlers({ random: () => 0.5, wait: async () => {} }),
)
beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  server.resetHandlers()
  server.events.removeAllListeners()
})
afterAll(() => server.close())
function Location() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output aria-label="Current URL">{location.search}</output>
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => navigate(1)}>Forward</button>
    </>
  )
}
function mount(url = "/orders") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 30_000 } },
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
function params() {
  return new URLSearchParams(
    screen.getByLabelText("Current URL").textContent ?? "",
  )
}
test("opens details, preserves the table, and restores focus after Escape", async () => {
  const user = userEvent.setup()
  mount("/orders?status=shipped&page=2&scroll=1520")
  await screen.findByText(/Page 2 of/)
  const viewport = screen.getByRole("region", { name: "Scrollable orders" })
  const trigger = screen.getAllByRole("button", { name: /View order/ })[5]
  const id = trigger.getAttribute("aria-label")!.replace("View order ", "")
  await user.click(trigger)
  const dialog = await screen.findByRole("dialog")
  await within(dialog).findByRole("heading", { name: "Order summary" })
  expect(params().get("order")).toBe(id)
  expect(params().get("status")).toBe("shipped")
  expect(viewport.isConnected).toBe(true)
  expect(viewport.scrollTop).toBe(1520)
  await user.keyboard("{Escape}")
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  )
  expect(params().get("order")).toBeNull()
  expect(screen.getByRole("region", { name: "Scrollable orders" })).toBe(
    viewport,
  )
  expect(viewport.scrollTop).toBe(1520)
  await waitFor(() => expect(trigger).toHaveFocus())
})
test("opens a direct detail link and closes without losing its filters", async () => {
  const user = userEvent.setup()
  mount("/orders?status=cancelled&page=2&order=ORD-00001")
  const dialog = await screen.findByRole("dialog")
  await within(dialog).findByRole("heading", { name: "Order summary" })
  expect(within(dialog).getByText(orders[0].customer.email)).toBeInTheDocument()
  await user.click(
    within(dialog).getByRole("button", { name: "Close order details" }),
  )
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  )
  expect(params().get("order")).toBeNull()
  expect(params().get("status")).toBe("cancelled")
  expect(params().get("page")).toBe("2")
})
test("detail failure leaves the list intact and retry reloads only details", async () => {
  let listRequests = 0
  let detailRequests = 0
  server.events.on("request:start", ({ request }) => {
    const path = new URL(request.url).pathname
    if (path === "/api/orders") listRequests++
    if (path === "/api/orders/ORD-00001") detailRequests++
  })
  server.use(
    http.get(
      "*/api/orders/ORD-00001",
      () =>
        HttpResponse.json(
          {
            error: {
              code: "TEMPORARY_FAILURE",
              message: "Temporary detail failure",
            },
          },
          { status: 503 },
        ),
      { once: true },
    ),
  )
  mount("/orders?order=ORD-00001")
  const dialog = await screen.findByRole("dialog")
  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "Temporary detail failure",
  )
  await waitFor(() =>
    expect(
      document.querySelectorAll("[data-order-row]").length,
    ).toBeGreaterThan(0),
  )
  fireEvent.click(within(dialog).getByRole("button", { name: "Retry details" }))
  await within(dialog).findByRole("heading", { name: "Order summary" })
  expect(listRequests).toBe(1)
  expect(detailRequests).toBe(2)
  server.events.removeAllListeners("request:start")
})
test("shows an honest missing-order state", async () => {
  mount("/orders?order=ORD-99999")
  const dialog = await screen.findByRole("dialog")
  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "Order not found",
  )
  expect(
    within(dialog).queryByRole("button", { name: "Retry details" }),
  ).not.toBeInTheDocument()
})
test("browser Back and Forward close and reopen the selected order", async () => {
  const user = userEvent.setup()
  mount()
  await screen.findByText("Page 1 of 100")
  const back = screen.getByRole("button", { name: "Back", exact: true })
  const forward = screen.getByRole("button", { name: "Forward", exact: true })
  await user.click(screen.getAllByRole("button", { name: /View order/ })[0])
  await screen.findByRole("dialog")
  const id = params().get("order")
  fireEvent.click(back)
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  )
  expect(params().get("order")).toBeNull()
  fireEvent.click(forward)
  await screen.findByRole("dialog")
  expect(params().get("order")).toBe(id)
})
test("traps keyboard focus inside the drawer", async () => {
  const user = userEvent.setup()
  mount("/orders?order=ORD-00001")
  const dialog = await screen.findByRole("dialog")
  await within(dialog).findByRole("heading", { name: "Order summary" })
  await waitFor(() =>
    expect(
      within(dialog).getByRole("button", { name: "Close order details" }),
    ).toHaveFocus(),
  )
  await user.tab()
  await waitFor(() =>
    expect(
      within(dialog).getByRole("region", { name: "Order details content" }),
    ).toHaveFocus(),
  )
  await user.tab()
  await waitFor(() =>
    expect(dialog.contains(document.activeElement)).toBe(true),
  )
  await user.tab({ shift: true })
  await waitFor(() =>
    expect(dialog.contains(document.activeElement)).toBe(true),
  )
})

test("the direct-linked order remains available when the list request fails", async () => {
  server.use(
    http.get(
      "*/api/orders",
      () =>
        HttpResponse.json(
          {
            error: {
              code: "TEMPORARY_FAILURE",
              message: "List temporarily unavailable",
            },
          },
          { status: 503 },
        ),
      { once: true },
    ),
  )
  const user = userEvent.setup()
  mount("/orders?order=ORD-00001")
  const dialog = await screen.findByRole("dialog")
  await within(dialog).findByRole("heading", { name: "Order summary" })
  await user.click(
    within(dialog).getByRole("button", { name: "Close order details" }),
  )
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "List temporarily unavailable",
  )
})
test("closing while details load cancels that fetch", async () => {
  let release!: () => void
  let signal: AbortSignal | undefined
  const originalFetch = globalThis.fetch
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    if (String(input).endsWith("/api/orders/ORD-00001"))
      signal = init?.signal ?? undefined
    return originalFetch(input, init)
  })
  server.use(
    http.get("*/api/orders/ORD-00001", async () => {
      await new Promise<void>((resolve) => {
        release = resolve
      })
      return HttpResponse.json({ data: orders[0] })
    }),
  )
  const user = userEvent.setup()
  mount("/orders?order=ORD-00001")
  const dialog = await screen.findByRole("dialog")
  await waitFor(() => expect(release).toBeDefined())
  expect(within(dialog).getByText("Loading order details…")).toBeInTheDocument()
  await user.click(
    within(dialog).getByRole("button", { name: "Close order details" }),
  )
  await waitFor(() => expect(signal?.aborted).toBe(true))
  release()
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  )
  expect(screen.queryByRole("alert")).not.toBeInTheDocument()
})

test("opening immediately after scrolling captures the current position", async () => {
  mount()
  await screen.findByText("Page 1 of 100")
  const viewport = screen.getByRole("region", { name: "Scrollable orders" })
  fireEvent.scroll(viewport, { target: { scrollTop: 1520 } })
  const trigger = screen.getAllByRole("button", { name: /View order/ })[5]
  fireEvent.click(trigger)
  const dialog = await screen.findByRole("dialog")
  await within(dialog).findByRole("heading", { name: "Order summary" })
  expect(params().get("scroll")).toBe("1520")
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Close order details" }),
  )
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  )
  expect(
    screen.getByRole("region", { name: "Scrollable orders" }).scrollTop,
  ).toBe(1520)
})
