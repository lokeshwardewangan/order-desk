import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import type { OrderStatus, OrderSummary } from "../order.types"

const statusLabels: Record<OrderStatus, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}
const statusStyles: Record<OrderStatus, string> = {
  processing: "border-amber-200 bg-amber-50 text-amber-800",
  shipped: "border-blue-200 bg-blue-50 text-blue-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-border bg-muted text-muted-foreground",
}
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})
const date = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
})

export function OrdersTable({
  result,
  sort,
  onSort,
  onPage,
}: {
  result: OrderListResponse
  sort: OrderSort
  onSort: (sort: OrderSort) => void
  onPage: (page: number) => void
}) {
  const orders: OrderSummary[] = result.data
  const { total, page, totalPages, pageSize } = result
  return (
    <section aria-labelledby="order-results-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <h2 id="order-results-heading" className="text-sm font-semibold">
            Order results
          </h2>
          <Badge variant="secondary">
            {total.toLocaleString("en-IN")} orders
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {sort.replace("-", " · ")}
        </span>
      </div>
      <Table className="min-w-[760px]">
        <TableCaption className="sr-only">
          Customer orders matching the current filters
        </TableCaption>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="pl-6">
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
                <ArrowUpDown aria-hidden="true" />
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
                  onSort(sort === "amount-desc" ? "amount-asc" : "amount-desc")
                }
              >
                Total
                <ArrowUpDown aria-hidden="true" />
              </Button>
            </TableHead>
            <TableHead scope="col" className="pr-6 text-right">
              Details
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!orders.length && (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center">
                {total ? (
                  <>
                    This page has no orders.{" "}
                    <Button variant="link" onClick={() => onPage(1)}>
                      Go to first page
                    </Button>
                  </>
                ) : (
                  "No orders match these filters. Try changing or clearing them."
                )}
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="py-4 pl-6 font-medium tabular-nums">
                {order.id}
              </TableCell>
              <TableCell className="py-4">
                <div className="font-medium">{order.customer.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {order.customer.email}
                </div>
              </TableCell>
              <TableCell className="py-4 text-muted-foreground">
                <time dateTime={order.placedAt}>
                  {date.format(new Date(order.placedAt))}
                </time>
              </TableCell>
              <TableCell className="py-4">
                <Badge
                  variant="outline"
                  className={"h-6 gap-1.5 " + statusStyles[order.status]}
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-current"
                  />
                  {statusLabels[order.status]}
                </Badge>
              </TableCell>
              <TableCell className="py-4 text-right font-medium tabular-nums">
                {currency.format(order.totalAmountPaise / 100)}
              </TableCell>
              <TableCell className="py-4 pr-6 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={"View order " + order.id}
                  disabled
                >
                  View
                  <ChevronRight aria-hidden="true" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
        <nav aria-label="Order pagination" className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
          <span className="px-2 text-xs text-muted-foreground">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </section>
  )
}
