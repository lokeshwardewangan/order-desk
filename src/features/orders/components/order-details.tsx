import type { Order } from "../order.types"
import { formatAmount, formatOrderDateTime } from "../utils/order-format"
import { ORDER_STATUS_LABELS } from "../order.constants"
import { OrderStatusBadge } from "./order-status-badge"
export function OrderDetails({ order }: { order: Order }) {
  const address = order.shippingAddress
  return (
    <div className="space-y-6 [&>section+section]:border-t [&>section+section]:pt-6">
      <section aria-labelledby="order-summary-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id="order-summary-heading" className="font-semibold">
            Order summary
          </h3>
          <OrderStatusBadge status={order.status} />
        </div>
        <dl className="grid grid-cols-[2fr_1fr] gap-5 border-y bg-muted/60 px-4 py-5">
          <div>
            <dt className="text-xs text-muted-foreground">Total amount</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight text-primary tabular-nums">
              {formatAmount(order.totalAmountPaise)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Items</dt>
            <dd className="mt-1 font-medium">{order.itemCount}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Placed at · IST</dt>
            <dd className="mt-1">
              <time dateTime={order.placedAt}>
                {formatOrderDateTime(order.placedAt)}
              </time>
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="order-customer-heading">
        <h3 id="order-customer-heading" className="mb-3 font-semibold">
          Customer
        </h3>
        <p className="font-medium">{order.customer.name}</p>
        <p className="mt-1 break-all text-muted-foreground">
          {order.customer.email}
        </p>
      </section>
      <section aria-labelledby="order-items-heading">
        <h3 id="order-items-heading" className="mb-3 font-semibold">
          Items
        </h3>
        <ul className="divide-y">
          {order.items.map((item) => (
            <li key={item.sku} className="space-y-2 py-4 first:pt-0 last:pb-0">
              <div className="flex justify-between gap-4">
                <span className="font-medium">{item.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatAmount(item.quantity * item.unitPricePaise)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.sku} · {item.quantity} ×{" "}
                {formatAmount(item.unitPricePaise)}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="order-address-heading">
        <h3 id="order-address-heading" className="mb-3 font-semibold">
          Shipping address
        </h3>
        <address className="leading-6 text-muted-foreground not-italic">
          {address.line1}
          <br />
          {address.city}, {address.state} {address.postalCode}
          <br />
          {address.country}
        </address>
      </section>
      <section aria-labelledby="order-timeline-heading">
        <h3 id="order-timeline-heading" className="mb-3 font-semibold">
          Order timeline
        </h3>
        <ol className="space-y-4 border-l pl-4">
          {order.timeline.map((event) => (
            <li key={event.status} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary"
              />
              <p className="font-medium">
                {event.status === "placed"
                  ? "Placed"
                  : ORDER_STATUS_LABELS[event.status]}
              </p>
              <time
                dateTime={event.occurredAt}
                className="text-xs text-muted-foreground"
              >
                {formatOrderDateTime(event.occurredAt)} IST
              </time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
