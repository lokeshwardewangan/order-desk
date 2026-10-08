import { useState } from "react"
import { SAMPLE_LAST_DATE, SAMPLE_WEEK_START } from "../sample-period"
import type { ChangeEvent, FormEvent } from "react"
import type { OrderViewState } from "../url-state"
import { InvalidOrderQuery, parseOrderQuery } from "../query"
import { orderListSearchParams } from "../url-state"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

type FilterKey =
  "q" | "status" | "from" | "to" | "minAmountPaise" | "maxAmountPaise"
const keys: FilterKey[] = [
  "q",
  "status",
  "from",
  "to",
  "minAmountPaise",
  "maxAmountPaise",
]
function draftFrom(state: OrderViewState) {
  return {
    q: state.q,
    status: state.status ?? "all",
    from: state.from ?? "",
    to: state.to ?? "",
    minAmountPaise:
      state.minAmountPaise === undefined
        ? ""
        : String(state.minAmountPaise / 100),
    maxAmountPaise:
      state.maxAmountPaise === undefined
        ? ""
        : String(state.maxAmountPaise / 100),
  }
}
export function OrderFilters({
  state,
  onChange,
}: {
  state: OrderViewState
  onChange: (changes: Partial<OrderViewState>) => void
}) {
  const [draft, setDraft] = useState(() => draftFrom(state))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const activeFilters = keys
    .filter((key) => state[key] !== undefined && state[key] !== "")
    .map((key) => ({
      id: key,
      label:
        key === "minAmountPaise"
          ? "Min ₹" + Number(state[key]) / 100
          : key === "maxAmountPaise"
            ? "Max ₹" + Number(state[key]) / 100
            : key + ": " + state[key],
    }))
  function field(key: FilterKey) {
    return {
      value: draft[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setDraft({ ...draft, [key]: event.target.value }),
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? "error-" + key : undefined,
    }
  }
  function apply(event: FormEvent) {
    event.preventDefault()
    const params = orderListSearchParams(state)
    const nextErrors: Record<string, string> = {}
    for (const key of keys) {
      let value = draft[key].trim()
      if (key === "minAmountPaise" || key === "maxAmountPaise") {
        if (value && !/^\d+(\.\d{1,2})?$/.test(value))
          nextErrors[key] =
            "Enter a positive amount with up to two decimal places"
        else if (value) {
          const [whole, decimal = ""] = value.split(".")
          value = String(Number(whole) * 100 + Number(decimal.padEnd(2, "0")))
        }
      }
      if (value) params.set(key, value)
      else params.delete(key)
    }
    try {
      const query = parseOrderQuery(params)
      if (Object.keys(nextErrors).length)
        throw new InvalidOrderQuery(nextErrors)
      setErrors({})
      onChange(query)
    } catch (error) {
      if (!(error instanceof InvalidOrderQuery)) throw error
      setErrors({ ...nextErrors, ...error.fields })
      const ids: Record<string, string> = {
        minAmountPaise: "order-min",
        maxAmountPaise: "order-max",
      }
      document
        .getElementById(
          ids[Object.keys({ ...nextErrors, ...error.fields })[0]] ??
            "order-" + Object.keys(error.fields)[0],
        )
        ?.focus()
    }
  }
  function preset(index: number) {
    const changes: Partial<OrderViewState> = {
      q: "",
      status:
        index === 1 ? "processing" : index === 3 ? "cancelled" : undefined,
      from: index === 3 ? SAMPLE_WEEK_START : undefined,
      to: index === 3 ? SAMPLE_LAST_DATE : undefined,
      minAmountPaise: index === 2 ? 1_000_000 : undefined,
      maxAmountPaise: undefined,
      sort: index === 2 ? "amount-desc" : "date-desc",
    }
    setDraft(draftFrom({ ...state, ...changes }))
    setErrors({})
    onChange(changes)
  }
  return (
    <form
      onSubmit={apply}
      noValidate
      aria-label="Order filters"
      className="border-b p-5 sm:p-6"
    >
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
              variant="outline"
              onClick={() => preset(index)}
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
            {...field("q")}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <NativeSelectOption value="delivered">Delivered</NativeSelectOption>
            <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-from">From date</Label>
          <Input
            id="order-from"
            type="date"
            className="h-10"
            {...field("from")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-to">To date</Label>
          <Input id="order-to" type="date" className="h-10" {...field("to")} />
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
      <Button type="submit" className="mt-4">
        Apply filters
      </Button>
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
                onClick={() =>
                  onChange({ [filter.id]: filter.id === "q" ? "" : undefined })
                }
              >
                {filter.label}
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
          onClick={() => preset(0)}
        >
          Clear all
        </Button>
      </div>
    </form>
  )
}
