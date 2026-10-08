import { useEffect, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import type { OrderViewState } from "../utils/order-url"
import { InvalidOrderQuery } from "../schemas/order-query.schema"
import {
  draftFrom,
  parseFilterDraft,
  activeFilterChips,
  FILTER_INPUT_IDS,
} from "../utils/order-filters"
import { orderListSearchParams } from "../utils/order-url"
import type { FilterKey } from "../utils/order-filters"
import type { OrderPreset } from "../order-presets"
export const SEARCH_DEBOUNCE_MS = 350

export function useOrderFilters(
  state: OrderViewState,
  onChange: (changes: Partial<OrderViewState>) => void,
) {
  const sourceKey = orderListSearchParams(state).toString()
  const [draftKey, setDraftKey] = useState(sourceKey)
  const [draft, setDraft] = useState(() => draftFrom(state))
  const [submittedSearch, setSubmittedSearch] = useState<string | null>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (draftKey !== sourceKey) {
    setDraftKey(sourceKey)
    if (submittedSearch !== state.q) {
      setDraft(draftFrom(state))
      setErrors({})
    }
    setSubmittedSearch(null)
  }
  useEffect(() => {
    if (isComposing || sourceKey !== draftKey || draft.q.trim() === state.q)
      return
    const timeout = window.setTimeout(() => {
      const q = draft.q.trim()
      setSubmittedSearch(q)
      onChange({ q })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [draft.q, state.q, sourceKey, draftKey, isComposing, onChange])

  function field(key: FilterKey) {
    return {
      value: draft[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setDraft((current) => ({ ...current, [key]: event.target.value })),
      ...(key === "q"
        ? {
            onCompositionStart: () => setIsComposing(true),
            onCompositionEnd: () => setIsComposing(false),
          }
        : {}),
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? "error-" + key : undefined,
    }
  }
  function apply(event: FormEvent) {
    event.preventDefault()
    try {
      const query = parseFilterDraft(draft, state)
      setErrors({})
      setSubmittedSearch(null)
      onChange(query)
    } catch (error) {
      if (!(error instanceof InvalidOrderQuery)) throw error
      setErrors(error.fields)
      const first = Object.keys(error.fields)[0] as FilterKey
      document.getElementById(FILTER_INPUT_IDS[first])?.focus()
    }
  }
  function preset(view: OrderPreset) {
    setSubmittedSearch(null)
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
    searchPending: draft.q.trim() !== state.q,
  }
}
