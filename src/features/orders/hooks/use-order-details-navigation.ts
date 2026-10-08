import { useLocation, useNavigate } from "react-router-dom"
import type { OrderViewState } from "../utils/order-url"
import { orderViewUrl } from "../utils/order-url"
export function useOrderDetailsNavigation(state: OrderViewState) {
  const navigate = useNavigate()
  const location = useLocation()
  function openOrder(id: string, scroll: number) {
    const list = { ...state, order: undefined, scroll }
    const listUrl = orderViewUrl(list)
    navigate(listUrl, { replace: true })
    navigate(orderViewUrl({ ...list, order: id }), {
      state: { orderDrawerList: listUrl },
    })
  }
  function closeOrder() {
    const listUrl = orderViewUrl({ ...state, order: undefined })
    if (location.state?.orderDrawerList === listUrl) navigate(-1)
    else navigate(listUrl, { replace: true })
  }
  return { openOrder, closeOrder }
}
