import { useVirtualOrders } from "../hooks/use-virtual-orders"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  SearchX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { OrderListResponse, OrderSort } from "../order-api.types"
import { SheetTrigger } from "@/components/ui/sheet"
import { OrderStatusBadge } from "./order-status-badge"
import { formatAmount, formatOrderDate } from "../utils/order-format"
import type { OrderSummary } from "../order.types"

const SORT_LABELS: Record<OrderSort, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Highest amount first",
  "amount-asc": "Lowest amount first",
}

export function OrdersTable({
  result,
  sort,
  onSort,
  onPage,
  savedScroll,
  onScrollChange,
  onOpenOrder,
}: {
  result: OrderListResponse
  sort: OrderSort
  onSort: (sort: OrderSort) => void
  onPage: (page: number) => void
  savedScroll: number
  onScrollChange: (scroll: number) => void
  onOpenOrder?: (id: string, scroll: number) => void
}) {
  const orders: OrderSummary[] = result.data
  const { total, page, totalPages, pageSize } = result
  const {
    viewportRef,
    viewportHeight,
    rows,
    paddingTop,
    paddingBottom,
    handleScroll,
    handleKeyDown,
    captureScroll,
  } = useVirtualOrders(orders, savedScroll, onScrollChange)
  return (
    <section aria-labelledby="order-results-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <h2 id="order-results-heading" className="text-sm font-semibold">
            Order results
          </h2>
          <span className="border-l pl-2.5 text-sm text-muted-foreground tabular-nums">
            {total.toLocaleString("en-IN")} orders
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {SORT_LABELS[sort]}
        </span>
      </div>
      {orders.length > 0 && (
        <p className="flex items-center gap-2 border-t px-5 py-2 text-xs text-muted-foreground lg:hidden">
          <MoveHorizontal aria-hidden="true" className="size-3.5 shrink-0" />
          Scroll horizontally for status, totals, and details.
        </p>
      )}
      <p id="table-scroll-help" className="sr-only">
        Focus the table region and use arrow keys, Page Up, Page Down, Home, or
        End to scroll through orders. Use pagination to change pages.
      </p>
      {orders.length ? (
        <Table
          className="min-w-[900px] table-fixed"
          aria-rowcount={orders.length ? total + 1 : undefined}
          containerProps={{
            ref: viewportRef,
            role: "region",
            "aria-label": "Scrollable orders",
            "aria-describedby": "table-scroll-help",
            tabIndex: 0,
            style: orders.length ? { height: viewportHeight } : undefined,
            className:
              "overflow-auto overscroll-contain [overflow-anchor:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            onScroll: handleScroll,
            onKeyDown: handleKeyDown,
          }}
        >
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <TableCaption className="sr-only">
            Customer orders matching the current filters
          </TableCaption>
          <TableHeader className="sticky top-0 z-20 bg-muted [&_th]:text-xs [&_th]:text-muted-foreground">
            <TableRow aria-rowindex={1} className="hover:bg-transparent">
              <TableHead
                scope="col"
                className="bg-muted pl-6 sm:sticky sm:left-0 sm:z-30"
              >
                Order ID
              </TableHead>
              <TableHead scope="col">Customer</TableHead>
              <TableHead
                scope="col"
                aria-sort={
                  sort.startsWith("date")
                    ? sort.endsWith("asc")
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2"
                  aria-label="Sort by order date"
                  onClick={() =>
                    onSort(sort === "date-desc" ? "date-asc" : "date-desc")
                  }
                >
                  Order date
                  {sort.startsWith("date") ? (
                    sort.endsWith("asc") ? (
                      <ArrowUp aria-hidden="true" />
                    ) : (
                      <ArrowDown aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown aria-hidden="true" />
                  )}
                </Button>
              </TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead
                scope="col"
                className="text-right"
                aria-sort={
                  sort.startsWith("amount")
                    ? sort.endsWith("asc")
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2"
                  aria-label="Sort by order amount"
                  onClick={() =>
                    onSort(
                      sort === "amount-desc" ? "amount-asc" : "amount-desc",
                    )
                  }
                >
                  Total
                  {sort.startsWith("amount") ? (
                    sort.endsWith("asc") ? (
                      <ArrowUp aria-hidden="true" />
                    ) : (
                      <ArrowDown aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown aria-hidden="true" />
                  )}
                </Button>
              </TableHead>
              <TableHead scope="col" className="pr-4 text-right">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <TableRow
                aria-hidden="true"
                className="border-0 hover:bg-transparent"
              >
                <TableCell
                  colSpan={6}
                  className="border-0 p-0"
                  style={{ height: paddingTop }}
                />
              </TableRow>
            )}
            {rows.map((virtualRow) => {
              const order = orders[virtualRow.index]
              return (
                <TableRow
                  key={order.id}
                  aria-rowindex={(page - 1) * pageSize + virtualRow.index + 2}
                  data-order-row={order.id}
                  className="group focus-within:bg-accent/60"
                  style={{ height: virtualRow.size }}
                >
                  <TableCell className="bg-background py-4 pl-6 font-medium text-primary tabular-nums group-focus-within:bg-accent group-hover:bg-muted sm:sticky sm:left-0 sm:z-10">
                    {order.id}
                  </TableCell>
                  <TableCell className="py-4">
                    <div
                      className="truncate font-medium"
                      title={order.customer.name}
                    >
                      {order.customer.name}
                    </div>
                    <div
                      className="mt-0.5 truncate text-xs text-muted-foreground"
                      title={order.customer.email}
                    >
                      {order.customer.email}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground">
                    <time dateTime={order.placedAt}>
                      {formatOrderDate(order.placedAt)}
                    </time>
                  </TableCell>
                  <TableCell className="py-4">
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium tabular-nums">
                    {formatAmount(order.totalAmountPaise)}
                  </TableCell>
                  <TableCell className="py-4 pr-4 text-right">
                    {onOpenOrder ? (
                      <SheetTrigger
                        id={"view-" + order.id}
                        aria-label={"View order " + order.id}
                        onClick={() => onOpenOrder(order.id, captureScroll())}
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 text-primary"
                          />
                        }
                      >
                        View
                        <ChevronRight aria-hidden="true" />
                      </SheetTrigger>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        aria-label={"View order " + order.id}
                      >
                        View
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {paddingBottom > 0 && (
              <TableRow
                aria-hidden="true"
                className="border-0 hover:bg-transparent"
              >
                <TableCell
                  colSpan={6}
                  className="border-0 p-0"
                  style={{ height: paddingBottom }}
                />
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : (
        <div
          role="status"
          className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-10 text-center"
        >
          <SearchX
            aria-hidden="true"
            className="size-7 text-muted-foreground"
          />
          <h3 className="font-semibold">
            {total ? "No orders on this page" : "No matching orders"}
          </h3>
          {total ? (
            <>
              <p className="text-sm text-muted-foreground">
                This page has no orders.
              </p>
              <Button
                variant="outline"
                className="h-9"
                onClick={() => onPage(1)}
              >
                Go to first page
              </Button>
            </>
          ) : (
            <p className="max-w-sm text-sm text-muted-foreground">
              No orders match these filters. Try changing or clearing them.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4 sm:px-6">
        <p role="status" className="text-xs text-muted-foreground">
          Showing{" "}
          {orders.length
            ? (page - 1) * pageSize +
              1 +
              "–" +
              ((page - 1) * pageSize + orders.length)
            : "0"}{" "}
          of {total.toLocaleString("en-IN")} orders
        </p>
        <nav
          aria-label="Order pagination"
          className="flex w-full items-center justify-between gap-2 sm:w-auto"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            aria-label="Previous"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="px-2 text-xs whitespace-nowrap text-muted-foreground">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            aria-label="Next"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </section>
  )
}
