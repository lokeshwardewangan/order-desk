import { useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import {
  orderViewSearchParams,
  readOrderViewState,
  updateOrderViewState,
} from "../utils/order-url"
import type { OrderViewState } from "../utils/order-url"

export function useOrderView() {
  const [params, setParams] = useSearchParams()
  const search = params.toString()
  const state = useMemo(() => readOrderViewState(search), [search])
  const canonical = orderViewSearchParams(state).toString()
  useEffect(() => {
    if (search !== canonical) setParams(canonical, { replace: true })
  }, [search, canonical, setParams])
  const update = useCallback(
    (changes: Partial<OrderViewState>) => {
      setParams((current) =>
        orderViewSearchParams(
          updateOrderViewState(readOrderViewState(current), changes),
        ),
      )
    },
    [setParams],
  )
  return { state, update }
}
