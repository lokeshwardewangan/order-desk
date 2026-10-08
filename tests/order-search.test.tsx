// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom"
import { OrderFilters } from "../src/features/orders/components/order-filters"
import { useOrderView } from "../src/features/orders/hooks/use-order-view"
import { SEARCH_DEBOUNCE_MS } from "../src/features/orders/hooks/use-order-filters"
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
function Harness() {
  const { state, update } = useOrderView()
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <OrderFilters state={state} onChange={update} />
      <output aria-label="URL">{location.search}</output>
      <output aria-label="History entry">{location.key}</output>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  )
}
function mount(entries = ["/orders"]) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Harness />
    </MemoryRouter>,
  )
}
function advance(ms = SEARCH_DEBOUNCE_MS) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}
function search(value: string) {
  fireEvent.change(screen.getByLabelText("Search orders"), {
    target: { value },
  })
}
test("waits for a pause and applies only the final search", () => {
  mount()
  search("Rah")
  advance(200)
  search("Rahul")
  advance(SEARCH_DEBOUNCE_MS - 1)
  expect(screen.getByLabelText("URL").textContent).toBe("")
  advance(1)
  expect(screen.getByLabelText("URL")).toHaveTextContent("q=Rahul")
})
test("search preserves unapplied advanced filters", () => {
  mount()
  fireEvent.change(screen.getByLabelText("Min amount (₹)"), {
    target: { value: "100" },
  })
  search("Rahul")
  advance()
  expect(screen.getByLabelText("Min amount (₹)")).toHaveValue(100)
  expect(screen.getByLabelText("URL").textContent).toBe("?q=Rahul")
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }))
  expect(screen.getByLabelText("URL")).toHaveTextContent("minAmountPaise=10000")
})
test("browser Back cancels pending search and restores the URL input", () => {
  mount(["/orders?q=previous", "/orders?q=current"])
  search("pending")
  fireEvent.click(screen.getByRole("button", { name: "Back", exact: true }))
  advance()
  expect(screen.getByLabelText("URL").textContent).toBe("?q=previous")
  expect(screen.getByLabelText("Search orders")).toHaveValue("previous")
})
test("clear all cancels a pending search", () => {
  mount()
  search("pending")
  fireEvent.click(screen.getByRole("button", { name: "Clear all" }))
  advance()
  expect(screen.getByLabelText("URL").textContent).toBe("")
  expect(screen.getByLabelText("Search orders")).toHaveValue("")
})
test("submitting applies immediately without a duplicate history entry", () => {
  mount()
  search("Rahul")
  fireEvent.submit(screen.getByRole("form", { name: "Order filters" }))
  expect(screen.getByLabelText("URL")).toHaveTextContent("q=Rahul")
  const key = screen.getByLabelText("History entry").textContent
  advance()
  expect(screen.getByLabelText("History entry").textContent).toBe(key)
})
test("waits for IME composition to finish", () => {
  mount()
  const input = screen.getByLabelText("Search orders")
  fireEvent.compositionStart(input)
  search("राहुल")
  advance()
  expect(screen.getByLabelText("URL").textContent).toBe("")
  fireEvent.compositionEnd(input)
  advance()
  expect(
    new URLSearchParams(screen.getByLabelText("URL").textContent ?? "").get(
      "q",
    ),
  ).toBe("राहुल")
})
test("a search clears pagination and preserves applied filters", () => {
  mount(["/orders?status=shipped&page=4"])
  search("Rahul")
  advance()
  expect(screen.getByLabelText("URL").textContent).toBe(
    "?q=Rahul&status=shipped",
  )
})

test("page-only browser navigation also cancels a pending search", () => {
  mount(["/orders", "/orders?page=2"])
  search("pending")
  fireEvent.click(screen.getByRole("button", { name: "Back", exact: true }))
  advance()
  expect(screen.getByLabelText("URL").textContent).toBe("")
  expect(screen.getByLabelText("Search orders")).toHaveValue("")
})
