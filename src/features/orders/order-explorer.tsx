import { useState } from "react"
import { Box, Link, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderDetailsDrawer } from "./components/order-details-drawer"
import { OrderFilters } from "./components/order-filters"
import { OrdersTable } from "./components/orders-table"
import { OrderLoading } from "./components/order-loading"
import { useOrderDetailsNavigation } from "./hooks/use-order-details-navigation"
import { useOrders } from "./hooks/use-orders"
import { useOrderView } from "./hooks/use-order-view"
import { orderListSearchParams } from "./utils/order-url"

export function OrderExplorer() {
  const { state, update } = useOrderView()
  const [copyStatus, setCopyStatus] = useState("")
  const query = useOrders(state)
  const { openOrder, closeOrder } = useOrderDetailsNavigation(state)
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus("View link copied")
    } catch {
      setCopyStatus("Unable to copy. Copy the URL from your address bar.")
    }
  }
  return (
    <OrderDetailsDrawer orderId={state.order} onClose={closeOrder}>
      <div className="min-h-screen bg-muted/60">
        <a
          href="#main-content"
          className="sr-only fixed top-3 left-3 z-50 rounded-md bg-background px-4 py-2 shadow-sm focus:not-sr-only"
        >
          Skip to orders
        </a>
        <header className="border-b bg-background">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Box aria-hidden="true" className="size-5" />
              </div>
              <span className="text-base font-semibold tracking-tight">
                Order Desk
              </span>
              <span
                aria-hidden="true"
                className="mx-2 hidden h-5 border-l sm:block"
              />
              <span className="hidden text-sm text-muted-foreground sm:block">
                Order operations
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Sample workspace
            </span>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-4 py-7 outline-none sm:px-8 sm:py-8"
        >
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Orders
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Find, review, and share customer orders.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                10,000 sample orders · Amounts in INR · Dates in India Standard
                Time
              </p>
            </div>
            <div className="sm:pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-9 bg-background"
                onClick={copyLink}
              >
                <Link aria-hidden="true" />
                Copy view link
              </Button>
              <p
                role="status"
                className={
                  copyStatus
                    ? "mt-2 max-w-64 text-xs text-muted-foreground"
                    : "sr-only"
                }
              >
                {copyStatus}
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border bg-background">
            <OrderFilters state={state} onChange={update} />
            <section
              aria-label="Order request status"
              aria-busy={query.isFetching}
            >
              {query.isFetching ? (
                <OrderLoading />
              ) : query.isError ? (
                <div
                  role="alert"
                  className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center"
                >
                  <TriangleAlert
                    aria-hidden="true"
                    className="mb-4 size-6 text-destructive"
                  />
                  <h2 className="font-semibold">Could not load orders.</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    {query.error.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your filters are saved. Try the request again.
                  </p>
                  <Button
                    className="mt-5 h-9"
                    onClick={() => void query.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : query.data ? (
                <OrdersTable
                  key={orderListSearchParams(state).toString()}
                  savedScroll={state.scroll}
                  onOpenOrder={openOrder}
                  onScrollChange={(scroll) =>
                    update({ scroll }, { replace: true })
                  }
                  result={query.data}
                  sort={state.sort}
                  onSort={(sort) => update({ sort })}
                  onPage={(page) => update({ page })}
                />
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </OrderDetailsDrawer>
  )
}
