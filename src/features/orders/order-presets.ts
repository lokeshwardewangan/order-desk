import type { OrderListQuery } from "./order-api.types"
import { SAMPLE_LAST_DATE, SAMPLE_WEEK_START } from "./sample-period"
const clearedFilters = {
  q: "",
  status: undefined,
  from: undefined,
  to: undefined,
  minAmountPaise: undefined,
  maxAmountPaise: undefined,
  sort: "date-desc",
} satisfies Partial<OrderListQuery>
export const ORDER_PRESETS = [
  { id: "all", label: "All orders", changes: clearedFilters },
  {
    id: "processing",
    label: "Processing",
    changes: { ...clearedFilters, status: "processing" },
  },
  {
    id: "high-value",
    label: "High value",
    changes: {
      ...clearedFilters,
      minAmountPaise: 1_000_000,
      sort: "amount-desc",
    },
  },
  {
    id: "recent-cancellations",
    label: "Recent cancellations",
    changes: {
      ...clearedFilters,
      status: "cancelled",
      from: SAMPLE_WEEK_START,
      to: SAMPLE_LAST_DATE,
    },
  },
] satisfies { id: string; label: string; changes: Partial<OrderListQuery> }[]
export type OrderPreset = (typeof ORDER_PRESETS)[number]
