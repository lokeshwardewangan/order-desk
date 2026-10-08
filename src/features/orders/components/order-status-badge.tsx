import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_LABELS } from "../order.constants"
import type { OrderStatus } from "../order.types"
const styles: Record<OrderStatus, string> = {
  processing: "border-amber-200 bg-amber-50 text-amber-800",
  shipped: "border-blue-200 bg-blue-50 text-blue-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-border bg-muted text-muted-foreground",
}
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={"h-6 gap-1.5 " + styles[status]}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}
