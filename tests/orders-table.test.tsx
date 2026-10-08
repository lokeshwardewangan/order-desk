// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest"
import { afterEach, expect, test, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Sheet } from "../src/components/ui/sheet"
import { OrdersTable } from "../src/features/orders/components/orders-table"
import { queryOrders } from "../src/mocks/orders/query-orders"
import { orders } from "../src/mocks/orders/data"
import { parseOrderQuery } from "../src/features/orders/schemas/order-query.schema"
afterEach(() => cleanup())
const result = queryOrders(
  orders,
  parseOrderQuery(new URLSearchParams("pageSize=1000")),
)
function mount(savedScroll = 0) {
  const onScrollChange = vi.fn()
  const view = render(
    <OrdersTable
      result={result}
      sort="date-desc"
      onSort={vi.fn()}
      onPage={vi.fn()}
      savedScroll={savedScroll}
      onScrollChange={onScrollChange}
    />,
  )
  return {
    ...view,
    onScrollChange,
    viewport: screen.getByRole("region", { name: "Scrollable orders" }),
  }
}
test("renders a bounded set of semantic rows from a 1,000-order page", () => {
  const { container } = mount()
  const rows = container.querySelectorAll("[data-order-row]")
  expect(rows.length).toBeGreaterThan(0)
  expect(rows.length).toBeLessThan(25)
  expect(screen.getByText(result.data[0].id)).toBeInTheDocument()
  expect(screen.queryByText(result.data[500].id)).not.toBeInTheDocument()
  expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", "10001")
  expect(rows[0]).toHaveAttribute("aria-rowindex", "2")
})
test("scrolling changes the rendered window and saves the offset", async () => {
  const { container, viewport, onScrollChange } = mount()
  fireEvent.scroll(viewport, { target: { scrollTop: 38_000 } })
  await screen.findByText(result.data[500].id)
  expect(screen.queryByText(result.data[0].id)).not.toBeInTheDocument()
  expect(container.querySelectorAll("[data-order-row]").length).toBeLessThan(25)
  await waitFor(() => expect(onScrollChange).toHaveBeenLastCalledWith(38_000))
})
test("restores a saved offset without rendering every earlier row", async () => {
  const { viewport, container } = mount(38_000)
  await screen.findByText(result.data[500].id)
  expect(viewport.scrollTop).toBe(38_000)
  expect(screen.queryByText(result.data[0].id)).not.toBeInTheDocument()
  expect(container.querySelectorAll("[data-order-row]").length).toBeLessThan(25)
})
test("supports keyboard scrolling to the final and first rows", async () => {
  const { viewport } = mount()
  viewport.focus()
  fireEvent.keyDown(viewport, { key: "End" })
  await screen.findByText(result.data[999].id)
  expect(viewport).toHaveFocus()
  fireEvent.keyDown(viewport, { key: "Home" })
  await screen.findByText(result.data[0].id)
  expect(viewport.scrollTop).toBe(0)
})
test("sort buttons keep their own keyboard behaviour", () => {
  const { viewport } = mount()
  fireEvent.keyDown(
    screen.getByRole("button", { name: "Sort by order date" }),
    { key: "End" },
  )
  expect(viewport.scrollTop).toBe(0)
})
test("clamps a saved scroll value beyond the page", async () => {
  const { viewport } = mount(Number.MAX_SAFE_INTEGER)
  await screen.findByText(result.data[999].id)
  expect(viewport.scrollTop).toBeLessThan(76_040)
})
test("pending scroll persistence is cancelled when the table unmounts", async () => {
  const { viewport, onScrollChange, unmount } = mount()
  fireEvent.scroll(viewport, { target: { scrollTop: 1000 } })
  unmount()
  await new Promise((resolve) => setTimeout(resolve, 180))
  expect(onScrollChange).not.toHaveBeenCalled()
})

test("restores a changed saved offset on the same page", async () => {
  const { rerender, viewport } = mount()
  rerender(
    <OrdersTable
      result={result}
      sort="date-desc"
      onSort={vi.fn()}
      onPage={vi.fn()}
      savedScroll={38000}
      onScrollChange={vi.fn()}
    />,
  )
  await screen.findByText(result.data[500].id)
  expect(viewport.scrollTop).toBe(38000)
})

test("Tab reaches rows outside the initial virtual window and Shift+Tab returns", async () => {
  const user = userEvent.setup()
  render(
    <Sheet open={false}>
      <OrdersTable
        result={result}
        sort="date-desc"
        onSort={vi.fn()}
        onPage={vi.fn()}
        savedScroll={0}
        onScrollChange={vi.fn()}
        onOpenOrder={vi.fn()}
      />
    </Sheet>,
  )
  screen
    .getByRole("button", { name: "View order " + result.data[0].id })
    .focus()
  for (let index = 1; index <= 15; index++) {
    await user.tab()
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "View order " + result.data[index].id,
        }),
      ).toHaveFocus(),
    )
  }
  for (let index = 14; index >= 0; index--) {
    await user.tab({ shift: true })
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "View order " + result.data[index].id,
        }),
      ).toHaveFocus(),
    )
  }
  expect(document.querySelectorAll("[data-order-row]").length).toBeLessThan(25)
  await user.tab({ shift: true })
  expect(
    screen.getByRole("button", { name: "Sort by order amount" }),
  ).toHaveFocus()
})

test("Tab leaves the final virtual row for pagination", async () => {
  const user = userEvent.setup()
  render(
    <Sheet open={false}>
      <OrdersTable
        result={result}
        sort="date-desc"
        onSort={vi.fn()}
        onPage={vi.fn()}
        savedScroll={0}
        onScrollChange={vi.fn()}
        onOpenOrder={vi.fn()}
      />
    </Sheet>,
  )
  fireEvent.keyDown(screen.getByRole("region", { name: "Scrollable orders" }), {
    key: "End",
  })
  const last = await screen.findByRole("button", {
    name: "View order " + result.data[999].id,
  })
  last.focus()
  await user.tab()
  expect(screen.getByRole("button", { name: "Next" })).toHaveFocus()
})
