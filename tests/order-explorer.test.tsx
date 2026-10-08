// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll, expect, test } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
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
