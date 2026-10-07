import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

interface FilterChip {
  id: string
  label: string
}

export function OrderFilters({
  activeFilters = [],
}: {
  activeFilters?: FilterChip[]
}) {
  return (
    <section aria-label="Order filters" className="border-b p-5 sm:p-6">
      <div
        role="group"
        aria-label="Order views"
        className="mb-6 flex flex-wrap gap-2"
      >
        {["All orders", "Processing", "High value", "Recent cancellations"].map(
          (view, index) => (
            <Button
              key={view}
              type="button"
              variant={index === 0 ? "secondary" : "ghost"}
              aria-pressed={index === 0}
              disabled
            >
              {view}
            </Button>
          ),
        )}
      </div>
      <div className="mb-5 space-y-2">
        <Label htmlFor="order-search">Search orders</Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="order-search"
            type="search"
            placeholder="Order ID, customer name, or email"
            className="h-10 pl-9"
            disabled
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="order-status">Status</Label>
          <NativeSelect
            id="order-status"
            className="w-full [&_select]:h-10"
            defaultValue="all"
            disabled
          >
            <NativeSelectOption value="all">All statuses</NativeSelectOption>
            <NativeSelectOption value="processing">
              Processing
            </NativeSelectOption>
            <NativeSelectOption value="shipped">Shipped</NativeSelectOption>
            <NativeSelectOption value="delivered">Delivered</NativeSelectOption>
            <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-from">From date</Label>
          <Input id="order-from" type="date" className="h-10" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-to">To date</Label>
          <Input id="order-to" type="date" className="h-10" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-min">Min amount (₹)</Label>
          <Input
            id="order-min"
            type="number"
            min="0"
            step="0.01"
            placeholder="No minimum"
            className="h-10"
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-max">Max amount (₹)</Label>
          <Input
            id="order-max"
            type="number"
            min="0"
            step="0.01"
            placeholder="No maximum"
            className="h-10"
            disabled
          />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          {activeFilters.length ? (
            activeFilters.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                variant="secondary"
                size="sm"
                aria-label={"Remove filter: " + filter.label}
                disabled
              >
                {filter.label}
                <X aria-hidden="true" />
              </Button>
            ))
          ) : (
            <span>No filters applied</span>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" disabled>
          Clear all
        </Button>
      </div>
    </section>
  )
}
