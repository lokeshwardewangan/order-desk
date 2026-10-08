import { OrderDetailsDrawer } from "./components/order-details-drawer"
import { useOrderDetailsNavigation } from "./hooks/use-order-details-navigation"
import { orderListSearchParams } from "./utils/order-url"
import { useState } from "react"
import { useOrders } from "./hooks/use-orders"
import { useOrderView } from "./hooks/use-order-view"
import { Box, Eye, Link } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderFilters } from "./components/order-filters"
import { OrdersTable } from "./components/orders-table"

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
      <div className="min-h-screen bg-slate-50/70">
        <a
          href="#main-content"
          className="sr-only fixed top-3 left-3 z-50 rounded-md bg-background px-4 py-2 shadow-sm focus:not-sr-only"
        >
          Skip to orders
        </a>
        <header className="border-b bg-background">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-teal-700 text-white">
                <Box aria-hidden="true" className="size-5" />
              </div>
              <span className="text-base font-semibold tracking-tight">
                Order Desk
              </span>
            </div>
            <Badge
              variant="outline"
              className="h-7 gap-1.5 bg-background px-2.5 text-muted-foreground"
            >
              <Eye aria-hidden="true" />
              Demo data
            </Badge>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-4 py-8 outline-none sm:px-8 sm:py-10"
        >
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-teal-700 uppercase">
                Order management
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Find, review, and share customer orders.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-2 bg-background"
              onClick={copyLink}
            >
              <Link aria-hidden="true" />
              Copy view link
            </Button>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            10,000 sample orders · Amounts in INR · Dates in India Standard Time
          </p>
          <p role="status" className="mb-3 text-sm text-muted-foreground">
            {copyStatus}
          </p>
          <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
            <OrderFilters state={state} onChange={update} />
            <section
              aria-label="Order request status"
              aria-busy={query.isFetching}
            >
              {query.isFetching ? (
                <p
                  role="status"
                  className="p-12 text-center text-muted-foreground"
                >
                  Loading orders…
                </p>
              ) : query.isError ? (
                <div role="alert" className="space-y-3 p-10 text-center">
                  <p>Could not load orders. {query.error.message}</p>
                  <Button onClick={() => void query.refetch()}>Retry</Button>
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
