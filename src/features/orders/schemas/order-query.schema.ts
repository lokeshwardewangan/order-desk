import { z } from "zod"
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  ORDER_SORTS,
  ORDER_STATUSES,
} from "../order.constants"

export class InvalidOrderQuery extends Error {
  fields: Record<string, string>
  constructor(fields: Record<string, string>) {
    super("Some order filters are invalid")
    this.name = "InvalidOrderQuery"
    this.fields = fields
  }
}
const optionalValue = (value: unknown) =>
  value === "" || value === null ? undefined : value
function integer(min = 0, max = Number.MAX_SAFE_INTEGER) {
  return z
    .string()
    .regex(/^\d+$/, "Enter a whole number")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max))
}
const calendarDate = z.string().refine((value) => {
  const time = Date.parse(value + "T00:00:00.000Z")
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
  )
}, "Enter a valid date in YYYY-MM-DD format")
const optionalDate = z.preprocess(optionalValue, calendarDate.optional())
const optionalAmount = z.preprocess(optionalValue, integer().optional())
export const orderQuerySchema = z
  .object({
    q: z.string().trim().default(""),
    status: z.preprocess(
      (value) => (value === "all" ? undefined : optionalValue(value)),
      z.enum(ORDER_STATUSES).optional(),
    ),
    from: optionalDate,
    to: optionalDate,
    minAmountPaise: optionalAmount,
    maxAmountPaise: optionalAmount,
    sort: z.preprocess(optionalValue, z.enum(ORDER_SORTS).default("date-desc")),
    page: z.preprocess(optionalValue, integer(1).default(1)),
    pageSize: z.preprocess(
      optionalValue,
      integer(1, MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    ),
  })
  .superRefine((query, context) => {
    if (query.from && query.to && query.from > query.to)
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "End date must be on or after start date",
      })
    if (
      query.minAmountPaise !== undefined &&
      query.maxAmountPaise !== undefined &&
      query.minAmountPaise > query.maxAmountPaise
    )
      context.addIssue({
        code: "custom",
        path: ["maxAmountPaise"],
        message: "Maximum amount must be at least the minimum amount",
      })
    if (query.page > Math.floor(Number.MAX_SAFE_INTEGER / query.pageSize))
      context.addIssue({
        code: "custom",
        path: ["page"],
        message: "Page is outside the supported range",
      })
  })
export function parseOrderQuery(params: URLSearchParams) {
  const result = orderQuerySchema.safeParse(
    Object.fromEntries([...params.keys()].map((key) => [key, params.get(key)])),
  )
  if (!result.success) {
    const fields: Record<string, string> = {}
    for (const issue of result.error.issues)
      fields[String(issue.path[0])] ??= issue.message
    throw new InvalidOrderQuery(fields)
  }
  return {
    ...result.data,
    status: result.data.status,
    from: result.data.from,
    to: result.data.to,
    minAmountPaise: result.data.minAmountPaise,
    maxAmountPaise: result.data.maxAmountPaise,
  }
}
