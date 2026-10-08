if (typeof HTMLElement !== "undefined") {
  const originalHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetHeight",
  )
  const originalWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetWidth",
  )
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return this.getAttribute("aria-label") === "Scrollable orders"
        ? Number.parseFloat(this.style.height) || 0
        : (originalHeight?.get?.call(this) ?? 0)
    },
  })
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return this.getAttribute("aria-label") === "Scrollable orders"
        ? 960
        : (originalWidth?.get?.call(this) ?? 0)
    },
  })
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get() {
      if (this.getAttribute("aria-label") !== "Scrollable orders") return 0
      const table = this.querySelector("table")
      return (
        40 +
        Array.from(table?.querySelectorAll("tbody tr") ?? []).reduce(
          (height, row) =>
            height +
            (Number.parseFloat((row as HTMLElement).style.height) ||
              Number.parseFloat(
                (row.firstElementChild as HTMLElement)?.style.height,
              ) ||
              0),
          0,
        )
      )
    },
  })
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return this.offsetHeight
    },
  })
  HTMLElement.prototype.scrollTo = function (
    options: ScrollToOptions | number,
    y?: number,
  ) {
    const top =
      typeof options === "number" ? (y ?? 0) : (options.top ?? this.scrollTop)
    if (this.scrollTop !== top) {
      this.scrollTop = top
      queueMicrotask(() => this.dispatchEvent(new Event("scroll")))
    }
  }
}
