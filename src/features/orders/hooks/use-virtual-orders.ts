import { useEffect, useLayoutEffect, useRef } from "react"
import type { KeyboardEvent, UIEvent } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { OrderSummary } from "../order.types"

const ROW_HEIGHT = 76
const HEADER_HEIGHT = 40
const MAX_VIEWPORT_HEIGHT = 560

export function useVirtualOrders(
  orders: OrderSummary[],
  savedScroll: number,
  onScrollChange: (scroll: number) => void,
) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const viewportHeight = Math.min(
    MAX_VIEWPORT_HEIGHT,
    Math.max(
      HEADER_HEIGHT + ROW_HEIGHT,
      HEADER_HEIGHT + orders.length * ROW_HEIGHT,
    ),
  )
  const maxScroll = Math.max(
    0,
    HEADER_HEIGHT + orders.length * ROW_HEIGHT - viewportHeight,
  )
  const initialScroll = Math.min(savedScroll, maxScroll)
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: orders.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (index) => orders[index].id,
    overscan: 5,
    paddingStart: HEADER_HEIGHT,
    scrollPaddingStart: HEADER_HEIGHT,
    initialOffset: initialScroll,
    initialRect: { width: 960, height: viewportHeight },
  })
  useLayoutEffect(() => {
    const target = Math.min(savedScroll, maxScroll)
    if (
      viewportRef.current &&
      Math.abs(viewportRef.current.scrollTop - target) > 1
    )
      virtualizer.scrollToOffset(target)
  }, [savedScroll, maxScroll, virtualizer])
  useEffect(() => () => window.clearTimeout(saveTimer.current), [])
  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const scroll = Math.max(0, Math.round(event.currentTarget.scrollTop))
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => onScrollChange(scroll), 150)
  }
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    const offsets: Record<string, number> = {
      ArrowDown: ROW_HEIGHT,
      ArrowUp: -ROW_HEIGHT,
      PageDown: viewportHeight - HEADER_HEIGHT,
      PageUp: -(viewportHeight - HEADER_HEIGHT),
    }
    if (event.key in offsets) {
      event.preventDefault()
      virtualizer.scrollToOffset(
        Math.max(
          0,
          Math.min(
            maxScroll,
            event.currentTarget.scrollTop + offsets[event.key],
          ),
        ),
      )
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      virtualizer.scrollToOffset(event.key === "Home" ? 0 : maxScroll)
    }
  }
  const rows = virtualizer.getVirtualItems()
  return {
    viewportRef,
    viewportHeight,
    rows,
    paddingTop: rows.length ? Math.max(0, rows[0].start - HEADER_HEIGHT) : 0,
    paddingBottom: rows.length
      ? Math.max(0, virtualizer.getTotalSize() - rows[rows.length - 1].end)
      : 0,
    handleScroll,
    handleKeyDown,
  }
}
