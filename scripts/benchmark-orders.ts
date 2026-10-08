import { performance } from "node:perf_hooks"
import { orders } from "../src/mocks/orders/data"
import { queryOrders } from "../src/mocks/orders/query-orders"
import { parseOrderQuery } from "../src/features/orders/schemas/order-query.schema"

const scenarios = [
  { name: "Latest orders, 1,000 per page", search: "pageSize=1000" },
  { name: "Amount sort, page 5", search: "sort=amount-desc&page=5" },
  {
    name: "Search with combined filters",
    search:
      "q=Rahul&status=delivered&from=2026-05-01&to=2026-10-07&minAmountPaise=100000&sort=amount-desc",
  },
]
const samples = 30
const results = scenarios.map(({ name, search }) => {
  const query = parseOrderQuery(new URLSearchParams(search))
  for (let run = 0; run < 5; run++) queryOrders(orders, query)
  const timings: number[] = []
  let total = 0
  for (let run = 0; run < samples; run++) {
    const start = performance.now()
    total = queryOrders(orders, query).total
    timings.push(performance.now() - start)
  }
  timings.sort((a, b) => a - b)
  return {
    scenario: name,
    matches: total,
    medianMs: Number(timings[Math.floor(samples / 2)].toFixed(2)),
    p95Ms: Number(timings[Math.ceil(samples * 0.95) - 1].toFixed(2)),
  }
})
console.log(
  orders.length + " records; " + samples + " samples after 5 warm-up runs.",
)
console.log(
  "Measures mock API query processing only, excluding simulated network delay and rendering.",
)
console.table(results)
