import { ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
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
import type { OrderStatus, OrderSummary } from "../types"

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

export function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  return (
    <section aria-labelledby="order-results-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <h2 id="order-results-heading" className="text-sm font-semibold">
            Order results
          </h2>
          <Badge variant="secondary">{orders.length} sample orders</Badge>
        </div>
        <span className="text-xs text-muted-foreground">Newest first</span>
      </div>
      <Table className="min-w-[760px]">
        <TableCaption className="sr-only">
          Sample orders for the layout preview
        </TableCaption>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="pl-6">
              Order ID
            </TableHead>
            <TableHead scope="col">Customer</TableHead>
            <TableHead scope="col" aria-sort="descending">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                aria-label="Sort by order date"
                disabled
              >
                Order date
                <ArrowDown aria-hidden="true" />
              </Button>
            </TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col" className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-mr-2"
                aria-label="Sort by order amount"
                disabled
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
        <p className="text-xs text-muted-foreground">
          Showing {orders.length ? "1–" + orders.length : "0"} of{" "}
          {orders.length} sample orders
        </p>
        <nav aria-label="Order pagination" className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled>
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
          <span className="px-2 text-xs text-muted-foreground">
            Page 1 of 1
          </span>
          <Button type="button" variant="outline" size="sm" disabled>
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </section>
  )
}
