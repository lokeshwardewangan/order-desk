export function dateBoundary(value: string, endOfDay = false): number {
  return Date.parse(
    value + (endOfDay ? "T23:59:59.999+05:30" : "T00:00:00.000+05:30"),
  )
}
