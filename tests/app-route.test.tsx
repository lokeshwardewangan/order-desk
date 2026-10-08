// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest"
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import { createOrderHandlers } from "../src/mocks/orders/handlers"
import App from "../src/App"
const server = setupServer(
  ...createOrderHandlers({ random: () => 0.5, wait: async () => {} }),
)
const initialUrl = window.location.href
beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState(null, "", initialUrl)
})
afterAll(() => server.close())
test("loads a direct route and copies its complete order link", async () => {
  window.history.replaceState(
    null,
    "",
    "/orders?status=cancelled&page=2&order=ORD-00001&scroll=1520",
  )
  const user = userEvent.setup()
  const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue()
  render(<App />)
  const dialog = await screen.findByRole("dialog", {}, { timeout: 5_000 })
  await within(dialog).findByRole("heading", { name: "Order summary" })
  await user.click(
    within(dialog).getByRole("button", { name: "Copy order link" }),
  )
  const copied = new URL(write.mock.calls[0][0])
  expect(copied.pathname).toBe("/orders")
  expect(copied.searchParams.get("order")).toBe("ORD-00001")
  expect(copied.searchParams.get("status")).toBe("cancelled")
  expect(copied.searchParams.get("scroll")).toBe("1520")
  await user.click(
    within(dialog).getByRole("button", { name: "Close order details" }),
  )
  await waitFor(() =>
    expect(new URLSearchParams(window.location.search).has("order")).toBe(
      false,
    ),
  )
  expect(new URLSearchParams(window.location.search).get("status")).toBe(
    "cancelled",
  )
})
