import { z } from "zod"
import { ORDER_STATUSES, MAX_PAGE_SIZE } from "../order.constants"
const nonnegativeInteger = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
export const orderSummarySchema = z.object({
  id: z.string().regex(/^ORD-\d{5}$/),
  customer: z.object({ name: z.string().min(1), email: z.email() }),
  placedAt: z.iso.datetime(),
  status: z.enum(ORDER_STATUSES),
  currency: z.literal("INR"),
  totalAmountPaise: nonnegativeInteger,
  itemCount: nonnegativeInteger,
})
export const orderListResponseSchema = z
  .object({
    data: z.array(orderSummarySchema),
    total: nonnegativeInteger,
    page: nonnegativeInteger.min(1),
    pageSize: nonnegativeInteger.min(1).max(MAX_PAGE_SIZE),
    totalPages: nonnegativeInteger,
  })
  .superRefine((result, context) => {
    if (
      result.totalPages !== Math.ceil(result.total / result.pageSize) ||
      result.data.length > result.pageSize ||
      result.data.length > result.total
    )
      context.addIssue({
        code: "custom",
        message: "Inconsistent order pagination",
      })
  })
export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum(["INVALID_QUERY", "NOT_FOUND", "TEMPORARY_FAILURE"]),
    message: z.string().min(1),
    fields: z.record(z.string(), z.string()).optional(),
  }),
})
