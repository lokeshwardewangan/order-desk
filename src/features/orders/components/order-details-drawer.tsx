import { useRef, useState } from "react"
import type { ReactNode } from "react"
import { Link, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useOrderDetails } from "../hooks/use-order-details"
import { OrdersApiError } from "../services/orders-api"
import { OrderDetails } from "./order-details"
import { OrderLoading } from "./order-loading"
export function OrderDetailsDrawer({
  orderId,
  onClose,
  children,
}: {
  orderId?: string
  onClose: () => void
  children: ReactNode
}) {
  const query = useOrderDetails(orderId)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [lastOrderId, setLastOrderId] = useState(orderId)
  if (orderId && orderId !== lastOrderId) setLastOrderId(orderId)
  const missing =
    query.error instanceof OrdersApiError && query.error.status === 404
  function restoreFocus() {
    return (
      document.getElementById("view-" + lastOrderId) ??
      document.querySelector<HTMLElement>('[aria-label="Scrollable orders"]') ??
      document.getElementById("main-content")
    )
  }
  return (
    <Sheet
      open={Boolean(orderId)}
      triggerId={orderId ? "view-" + orderId : null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {children}
      <SheetContent
        initialFocus={closeRef}
        finalFocus={restoreFocus}
        showCloseButton={false}
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="relative border-b bg-muted/60 p-6 pr-16">
          <SheetTitle className="text-xl font-semibold">
            Order {orderId ?? lastOrderId}
          </SheetTitle>
          <SheetDescription>
            Customer, items, delivery address, and order history.
          </SheetDescription>
          <SheetClose
            render={
              <Button
                ref={closeRef}
                variant="ghost"
                size="icon-sm"
                aria-label="Close order details"
                className="absolute top-5 right-5 size-9"
              />
            }
          >
            <X aria-hidden="true" />
          </SheetClose>
        </SheetHeader>
        <div
          role="region"
          aria-label="Order details content"
          tabIndex={0}
          aria-busy={query.isFetching}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {query.isFetching ? (
            <OrderLoading detail />
          ) : query.isError ? (
            <div
              role="alert"
              className="space-y-3 border-l-2 border-destructive bg-muted/60 p-5"
            >
              <h3 className="font-semibold">
                {missing ? "Order not found" : "Could not load order details"}
              </h3>
              <p className="text-muted-foreground">
                {missing
                  ? "This order may not exist. Close this panel to continue browsing."
                  : query.error.message}
              </p>
              {!missing && (
                <Button onClick={() => void query.refetch()}>
                  Retry details
                </Button>
              )}
            </div>
          ) : query.data ? (
            <OrderDetails order={query.data.data} />
          ) : null}
        </div>
        <div className="border-t p-5">
          <OrderLink key={orderId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
function OrderLink() {
  const [message, setMessage] = useState("")
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setMessage("Order link copied")
    } catch {
      setMessage("Unable to copy. Copy the URL from your address bar.")
    }
  }
  return (
    <>
      <Button variant="outline" className="h-9" onClick={copy}>
        <Link aria-hidden="true" />
        Copy order link
      </Button>
      <p
        role="status"
        className={message ? "mt-2 text-xs text-muted-foreground" : "sr-only"}
      >
        {message}
      </p>
    </>
  )
}
