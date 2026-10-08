import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import type { OrderViewState } from "../utils/order-url"
import { InvalidOrderQuery } from "../schemas/order-query.schema"
import {
  draftFrom,
  filterDraftKey,
  parseFilterDraft,
  activeFilterChips,
  FILTER_INPUT_IDS,
} from "../utils/order-filters"
import type { FilterKey } from "../utils/order-filters"
import type { OrderPreset } from "../order-presets"
export function useOrderFilters(
  state: OrderViewState,
  onChange: (changes: Partial<OrderViewState>) => void,
) {
  const sourceKey = filterDraftKey(state)
  const [draftKey, setDraftKey] = useState(sourceKey)
  const [draft, setDraft] = useState(() => draftFrom(state))
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (draftKey !== sourceKey) {
    setDraftKey(sourceKey)
    setDraft(draftFrom(state))
    setErrors({})
  }
  function field(key: FilterKey) {
    return {
      value: draft[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setDraft((current) => ({ ...current, [key]: event.target.value })),
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? "error-" + key : undefined,
    }
  }
  function apply(event: FormEvent) {
    event.preventDefault()
    try {
      const query = parseFilterDraft(draft, state)
      setErrors({})
      onChange(query)
    } catch (error) {
      if (!(error instanceof InvalidOrderQuery)) throw error
      setErrors(error.fields)
      const first = Object.keys(error.fields)[0] as FilterKey
      document.getElementById(FILTER_INPUT_IDS[first])?.focus()
    }
  }
  function preset(view: OrderPreset) {
    setDraft(draftFrom({ ...state, ...view.changes }))
    setErrors({})
    onChange(view.changes)
  }
  return {
    field,
    apply,
    preset,
    errors,
    activeFilters: activeFilterChips(state),
  }
}
