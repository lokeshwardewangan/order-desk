import { expect, test } from "vitest"
import {
  parseOrderQuery,
  InvalidOrderQuery,
} from "../src/features/orders/schemas/order-query.schema"
import {
  draftFrom,
  parseFilterDraft,
} from "../src/features/orders/utils/order-filters"
const current = () => parseOrderQuery(new URLSearchParams())
test("converts rupees to integer paise without rounding decimal fractions", () => {
  const query = current()
  const result = parseFilterDraft(
    { ...draftFrom(query), minAmountPaise: "0.29", maxAmountPaise: "1234.56" },
    query,
  )
  expect(result.minAmountPaise).toBe(29)
  expect(result.maxAmountPaise).toBe(123456)
})
test.each(["-1", "1.001", "1e3", "90071992547409.92"])(
  "rejects invalid or unsafe monetary input %s",
  (value) => {
    const query = current()
    expect(() =>
      parseFilterDraft({ ...draftFrom(query), minAmountPaise: value }, query),
    ).toThrow(InvalidOrderQuery)
  },
)
test("reports independent amount and date errors together", () => {
  const query = current()
  try {
    parseFilterDraft(
      {
        ...draftFrom(query),
        minAmountPaise: "1.001",
        from: "2026-10-07",
        to: "2026-10-01",
      },
      query,
    )
    expect.fail("Invalid filters must be rejected")
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidOrderQuery)
    expect((error as InvalidOrderQuery).fields).toHaveProperty("minAmountPaise")
    expect((error as InvalidOrderQuery).fields).toHaveProperty("to")
  }
})
