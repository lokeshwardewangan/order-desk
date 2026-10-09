import { useState } from "react"
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { OrderListQuery } from "../order-api.types"
import type { OrderViewState } from "../utils/order-url"
import { useOrderFilters } from "../hooks/use-order-filters"
import { ORDER_PRESETS } from "../order-presets"
export function OrderFilters({
  state,
  onChange,
}: {
  state: OrderViewState
  onChange: (changes: Partial<OrderViewState>) => void
}) {
  const { field, apply, preset, errors, activeFilters, searchPending } =
    useOrderFilters(state, onChange)
  const [showRanges, setShowRanges] = useState(false)
  const rangesExpanded = showRanges || Object.keys(errors).length > 0
  return (
    <form
      onSubmit={apply}
      noValidate
      aria-label="Order filters"
      className="border-b"
    >
      <div
        role="group"
        aria-label="Order views"
        className="flex gap-x-1 overflow-x-auto border-b px-3 sm:px-4"
      >
        {ORDER_PRESETS.map((view) => (
          <Button
            key={view.id}
            type="button"
            variant="ghost"
            aria-pressed={Object.entries(view.changes).every(
              ([key, value]) => state[key as keyof OrderListQuery] === value,
            )}
            className="h-12 rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-3 text-muted-foreground hover:bg-muted/50 focus-visible:ring-inset aria-pressed:border-b-primary aria-pressed:text-primary"
            onClick={() => preset(view)}
          >
            {view.label}
          </Button>
        ))}
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="space-y-2">
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
                {...field("q")}
                aria-describedby="search-help"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-status">Status</Label>
            <NativeSelect
              id="order-status"
              className="w-full [&_select]:h-10"
              {...field("status")}
            >
              <NativeSelectOption value="all">All statuses</NativeSelectOption>
              <NativeSelectOption value="processing">
                Processing
              </NativeSelectOption>
              <NativeSelectOption value="shipped">Shipped</NativeSelectOption>
              <NativeSelectOption value="delivered">
                Delivered
              </NativeSelectOption>
              <NativeSelectOption value="cancelled">
                Cancelled
              </NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
        <p
          id="search-help"
          role="status"
          className="text-xs text-muted-foreground"
        >
          {searchPending
            ? "Waiting to search…"
            : "Search updates as you type. Use Apply filters for status, dates, and amounts."}
        </p>

        <Button
          type="button"
          variant="ghost"
          className="mt-3 h-9 px-0 text-primary sm:hidden"
          aria-expanded={rangesExpanded}
          aria-controls="order-range-filters"
          onClick={() => setShowRanges(!rangesExpanded)}
        >
          Date & amount filters
          <ChevronDown
            aria-hidden="true"
            className={rangesExpanded ? "rotate-180" : ""}
          />
        </Button>
        <div className="mt-3 flex flex-col gap-4 sm:mt-4 xl:flex-row xl:items-end">
          <div
            id="order-range-filters"
            className={
              (rangesExpanded ? "grid" : "hidden") +
              " min-w-0 flex-1 grid-cols-2 gap-4 sm:grid xl:grid-cols-4"
            }
          >
            <div className="col-span-2 min-w-0 space-y-2 sm:col-span-1">
              <Label htmlFor="order-from">From date</Label>
              <Input
                id="order-from"
                type="date"
                className="h-10"
                {...field("from")}
              />
            </div>
            <div className="col-span-2 min-w-0 space-y-2 sm:col-span-1">
              <Label htmlFor="order-to">To date</Label>
              <Input
                id="order-to"
                type="date"
                className="h-10"
                {...field("to")}
              />
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
                {...field("minAmountPaise")}
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
                {...field("maxAmountPaise")}
              />
            </div>
          </div>
          <Button type="submit" className="h-10 xl:shrink-0">
            Apply filters
          </Button>
        </div>
        {Object.entries(errors).map(([key, message]) => (
          <p
            key={key}
            id={"error-" + key}
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {message}
          </p>
        ))}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal aria-hidden="true" className="size-3.5" />
            {activeFilters.length ? (
              activeFilters.map((filter) => (
                <Button
                  key={filter.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-auto min-h-8 max-w-full rounded-md py-1 [&>span]:break-all"
                  aria-label={"Remove filter: " + filter.label}
                  onClick={() =>
                    onChange({
                      [filter.id]: filter.id === "q" ? "" : undefined,
                    })
                  }
                >
                  <span className="whitespace-normal">{filter.label}</span>
                  <X aria-hidden="true" />
                </Button>
              ))
            ) : (
              <span>No filters applied</span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => preset(ORDER_PRESETS[0])}
          >
            Clear all
          </Button>
        </div>
      </div>
    </form>
  )
}
