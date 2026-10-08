import assert from "node:assert/strict"
import {
  DATASET_REFERENCE_DATE,
  DATASET_SEED,
  generateOrders,
  ORDER_COUNT,
  orders,
} from "../src/mocks/orders/data"
import { ORDER_STATUSES } from "../src/features/orders/order.constants"

assert.equal(orders.length, ORDER_COUNT)
assert.ok(ORDER_COUNT >= 10_000)
assert.equal(new Set(orders.map((order) => order.id)).size, ORDER_COUNT)
assert.deepEqual(orders, generateOrders())
assert.notDeepEqual(generateOrders(10), generateOrders(10, DATASET_SEED + 1))
assert.deepEqual(generateOrders(0), [])
assert.deepEqual(generateOrders(10), orders.slice(0, 10))

for (const count of [-1, 1.5, Infinity, NaN]) {
  assert.throws(() => generateOrders(count), RangeError)
}
for (const seed of [-1, 1.5, Infinity, NaN, 0x100000000]) {
  assert.throws(() => generateOrders(1, seed), RangeError)
}

const referenceTime = Date.parse(DATASET_REFERENCE_DATE)
const counts: Record<string, number> = {}
const customerAddresses = new Map<string, string>()

for (const order of orders) {
  assert.match(order.id, /^ORD-\d{5}$/)
  assert.ok(ORDER_STATUSES.includes(order.status))
  counts[order.status] = (counts[order.status] ?? 0) + 1
  assert.equal(order.currency, "INR")
  assert.match(order.customer.email, /@example\.com$/)
  assert.ok(order.customer.name.length > 0)
  assert.ok(Number.isFinite(Date.parse(order.placedAt)))
  assert.ok(Date.parse(order.placedAt) <= referenceTime)

  assert.ok(order.items.length >= 1 && order.items.length <= 4)
  assert.equal(
    new Set(order.items.map((item) => item.sku)).size,
    order.items.length,
  )
  for (const item of order.items) {
    assert.ok(Number.isInteger(item.quantity) && item.quantity > 0)
    assert.ok(Number.isInteger(item.unitPricePaise) && item.unitPricePaise > 0)
  }
  assert.equal(
    order.totalAmountPaise,
    order.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPricePaise,
      0,
    ),
  )
  assert.equal(
    order.itemCount,
    order.items.reduce((sum, item) => sum + item.quantity, 0),
  )
  assert.ok(Number.isSafeInteger(order.totalAmountPaise))

  assert.equal(order.timeline[0].status, "placed")
  assert.equal(order.timeline[0].occurredAt, order.placedAt)
  assert.equal(order.timeline.at(-1)?.status, order.status)
  let previousTime = Date.parse(order.placedAt)
  for (const event of order.timeline) {
    const eventTime = Date.parse(event.occurredAt)
    assert.ok(Number.isFinite(eventTime))
    assert.ok(eventTime >= previousTime && eventTime <= referenceTime)
    previousTime = eventTime
  }

  assert.equal(order.shippingAddress.country, "India")
  assert.match(order.shippingAddress.postalCode, /^\d{6}$/)
  const address = JSON.stringify(order.shippingAddress)
  const previousAddress = customerAddresses.get(order.customer.email)
  if (previousAddress !== undefined) assert.equal(address, previousAddress)
  customerAddresses.set(order.customer.email, address)
}

for (const status of ORDER_STATUSES) assert.ok(counts[status] > 0)
assert.ok(orders.some((order) => order.totalAmountPaise >= 1_000_000))
assert.ok(orders.some((order) => order.totalAmountPaise < 1_000_000))
assert.ok(
  orders.some(
    (order) =>
      order.status === "cancelled" &&
      Date.parse(order.placedAt) >= referenceTime - 7 * 24 * 60 * 60 * 1_000,
  ),
)

console.log(
  "Verified " +
    ORDER_COUNT.toLocaleString("en-IN") +
    " unique, repeatable orders with consistent totals and timelines.",
)
console.table(counts)
