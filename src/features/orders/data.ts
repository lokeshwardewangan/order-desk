import type {
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
  ShippingAddress,
} from "./types"

export const ORDER_COUNT = 10_000
export const DATASET_SEED = 42
import { DATASET_REFERENCE_DATE } from "./sample-period"
export { DATASET_REFERENCE_DATE } from "./sample-period"

const HOUR = 60 * 60 * 1_000
const DAY = 24 * HOUR
const referenceTime = Date.parse(DATASET_REFERENCE_DATE)

const firstNames = [
  "Rahul",
  "Asha",
  "Meera",
  "Arjun",
  "Priya",
  "Vikram",
  "Neha",
  "Rohan",
  "Ananya",
  "Karan",
  "Ishita",
  "Amit",
  "Sneha",
  "Dev",
  "Pooja",
  "Aditya",
  "Kavya",
  "Nikhil",
  "Sana",
  "Varun",
]
const lastNames = [
  "Sharma",
  "Patel",
  "Singh",
  "Verma",
  "Gupta",
  "Rao",
  "Iyer",
  "Das",
  "Joshi",
  "Kumar",
  "Nair",
  "Mehta",
  "Roy",
  "Shah",
  "Reddy",
  "Mishra",
  "Kapoor",
  "Sethi",
  "Bose",
  "Jain",
]

const locations = [
  { city: "Bengaluru", state: "Karnataka", postalCode: "560001" },
  { city: "Mumbai", state: "Maharashtra", postalCode: "400001" },
  { city: "Delhi", state: "Delhi", postalCode: "110001" },
  { city: "Hyderabad", state: "Telangana", postalCode: "500001" },
  { city: "Chennai", state: "Tamil Nadu", postalCode: "600001" },
  { city: "Pune", state: "Maharashtra", postalCode: "411001" },
  { city: "Jaipur", state: "Rajasthan", postalCode: "302001" },
  { city: "Raipur", state: "Chhattisgarh", postalCode: "492001" },
]

const products = [
  { sku: "SKU-001", name: "Wireless headphones", unitPricePaise: 249_900 },
  { sku: "SKU-002", name: "Running shoes", unitPricePaise: 319_900 },
  { sku: "SKU-003", name: "Laptop stand", unitPricePaise: 89_900 },
  { sku: "SKU-004", name: "Mechanical keyboard", unitPricePaise: 459_900 },
  { sku: "SKU-005", name: "USB-C hub", unitPricePaise: 179_900 },
  { sku: "SKU-006", name: "Travel backpack", unitPricePaise: 219_900 },
  { sku: "SKU-007", name: "Desk lamp", unitPricePaise: 129_900 },
  { sku: "SKU-008", name: "Smartwatch", unitPricePaise: 799_900 },
  { sku: "SKU-009", name: "Cotton T-shirt", unitPricePaise: 59_900 },
  { sku: "SKU-010", name: "Water bottle", unitPricePaise: 49_900 },
  { sku: "SKU-011", name: "Portable monitor", unitPricePaise: 1_499_900 },
  { sku: "SKU-012", name: "Wireless mouse", unitPricePaise: 99_900 },
]
function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function createCustomer(index: number): Customer {
  const first = firstNames[index % firstNames.length]
  const last = lastNames[Math.floor(index / firstNames.length)]
  return {
    name: first + " " + last,
    email:
      (first + "." + last + "." + (index + 1)).toLowerCase() + "@example.com",
  }
}

function createAddress(customerIndex: number): ShippingAddress {
  return {
    line1: customerIndex + 1 + ", Example Residency, Demo Road",
    ...locations[customerIndex % locations.length],
    country: "India",
  }
}

function chooseStatus(age: number, roll: number): OrderStatus {
  if (roll < 0.12) return "cancelled"
  if (age < DAY) return "processing"
  if (age < 4 * DAY) return roll < 0.45 ? "processing" : "shipped"
  if (roll < 0.2) return "processing"
  if (roll < 0.35) return "shipped"
  return "delivered"
}

function createTimeline(
  placedTime: number,
  status: OrderStatus,
): OrderTimelineEvent[] {
  const timeline: OrderTimelineEvent[] = [
    { status: "placed", occurredAt: new Date(placedTime).toISOString() },
    {
      status: "processing",
      occurredAt: new Date(placedTime + HOUR / 4).toISOString(),
    },
  ]

  if (status === "cancelled") {
    const delay = Math.min(12 * HOUR, (referenceTime - placedTime) / 2)
    timeline.push({
      status: "cancelled",
      occurredAt: new Date(placedTime + delay).toISOString(),
    })
  } else if (status === "shipped" || status === "delivered") {
    timeline.push({
      status: "shipped",
      occurredAt: new Date(placedTime + DAY).toISOString(),
    })
    if (status === "delivered") {
      timeline.push({
        status: "delivered",
        occurredAt: new Date(placedTime + 4 * DAY).toISOString(),
      })
    }
  }

  return timeline
}

export function generateOrders(
  count = ORDER_COUNT,
  seed = DATASET_SEED,
): Order[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError("Order count must be a non-negative safe integer")
  }
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError("Seed must be an unsigned 32-bit integer")
  }

  const random = createRandom(seed)
  const integer = (max: number) => Math.floor(random() * max)

  return Array.from({ length: count }, (_, index) => {
    const customerIndex = integer(firstNames.length * lastNames.length)
    const placedTime = referenceTime - HOUR - integer(180 * DAY)
    const status = chooseStatus(referenceTime - placedTime, random())
    const lineCount = 1 + integer(4)
    const selectedProducts = new Set<number>()
    const items: OrderItem[] = []

    while (items.length < lineCount) {
      const productIndex = integer(products.length)
      if (selectedProducts.has(productIndex)) continue
      selectedProducts.add(productIndex)
      items.push({ ...products[productIndex], quantity: 1 + integer(3) })
    }

    return {
      id: "ORD-" + String(index + 1).padStart(5, "0"),
      customer: createCustomer(customerIndex),
      placedAt: new Date(placedTime).toISOString(),
      status,
      currency: "INR",
      totalAmountPaise: items.reduce(
        (sum, item) => sum + item.unitPricePaise * item.quantity,
        0,
      ),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
      shippingAddress: createAddress(customerIndex),
      timeline: createTimeline(placedTime, status),
    }
  })
}
export const orders = generateOrders()
