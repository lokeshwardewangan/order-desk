import { Box, Eye, Link } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderFilters } from "./components/order-filters"
import { OrdersTable } from "./components/orders-table"
import { previewOrders } from "./preview-orders"

export function OrderExplorer() {
  return (
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
            Layout preview
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
            disabled
          >
            <Link aria-hidden="true" />
            Copy view link
          </Button>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Sample orders are shown below. Filters and actions are unavailable in
          this preview.
        </p>
        <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
          <OrderFilters />
          <OrdersTable orders={previewOrders} />
        </div>
      </main>
    </div>
  )
}
