# Order Desk

A frontend order explorer built for **Problem Statement 1: a data explorer that stays fast and never shows the wrong results**. It supports searching, filtering, sorting, and inspecting 10,000 deterministic sample orders.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?logo=vercel)](https://order-desk-lokeshwar.vercel.app) ![React](https://img.shields.io/badge/React-19-149ECA?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white) ![Tests](https://img.shields.io/badge/Tests-121_passing-16803D)

**[Live application ↗](https://order-desk-lokeshwar.vercel.app)** · **[Public repository](https://github.com/lokeshwardewangan/order-desk)**

## Assignment coverage

| Requirement                | Implementation                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Large dataset and mock API | 10,000 seeded orders; MSW handles search, combined filters, sorting, and pagination before returning results.                          |
| Slow and failed requests   | Every new API request simulates 200–3,000ms latency and a 10% chance of failure.                                                       |
| No stale results           | 350ms search debounce, fetch cancellation, and query keys tied to the applied criteria.                                                |
| Restore the same view      | Search, filters, sort, page, scroll, and selected order live in the URL; refresh, shared links, and Back/Forward restore them.         |
| Fast large lists           | Paginated responses and virtualized table rows; 100 orders per page by default, up to 1,000 through `pageSize`.                        |
| Honest request states      | Separate loading, empty, error, and retry states. Detail failures leave the list available, and retry reloads only the failed request. |
| Accessibility              | Labelled filters, visible focus, live result/error announcements, keyboard scrolling and row navigation, and drawer focus handling.    |
| Deep-linked details        | A URL-controlled drawer displays customer, items, address, and timeline; closing preserves filters and table scroll.                   |

## 🚀 Run locally

Tested with **Node.js 22.18** and **Bun 1.3.4**. No environment variables, API keys, or separate backend are required.

```bash
git clone https://github.com/lokeshwardewangan/order-desk.git
cd order-desk
bun install --frozen-lockfile
bun run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

```bash
bun run build
bun run preview
```

MSW runs in development and the production demo. Use localhost or HTTPS so the service worker can start.

## Architecture and state management

**Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui + Base UI, React Router, TanStack Query, TanStack Virtual, Zod, and MSW.

- **Applied view → URL:** [`useOrderView`](src/features/orders/hooks/use-order-view.ts) owns applied criteria. Changing filters resets page and scroll. Scroll updates replace history entries and do not refetch the list.
- **Input drafts → React state:** [`useOrderFilters`](src/features/orders/hooks/use-order-filters.ts) debounces search; status, dates, and amounts apply together on submission. Search updates preserve unapplied advanced edits.
- **Fetched data → TanStack Query:** list keys contain API criteria; details have a separate key. Fetch functions consume the query's AbortSignal. Loading/error states replace previous list results, preventing them from looking current.
- **API boundary → MSW and Zod:** [`queryOrders`](src/mocks/orders/query-orders.ts) filters and sorts before pagination. Zod validates query parameters and responses. `GET /api/orders` returns summaries; `GET /api/orders/:id` returns full details.

<details>
<summary>Project structure</summary>

```text
src/app/                   Router and providers
src/components/ui/         Shared UI primitives
src/features/orders/
  components/              Filters, table, and detail drawer
  hooks/                   Queries, drafts, URL state, and navigation
  schemas/                 Query and response validation
  services/                Fetch functions and API errors
  utils/                   URL, filter, date, and formatting helpers
src/mocks/orders/          Seeded dataset and API handlers
tests/                     API and interaction tests
scripts/                   Dataset checks and query benchmarks
```

</details>

## Key tradeoffs

- **Pagination + virtualization:** predictable page navigation and bounded responses, with only visible rows and overscan mounted. Fixed 76px rows simplify restoration; expanded content belongs in the drawer.
- **Explicit retries:** failures stay visible until the user retries. Query results remain fresh for 30 seconds; window focus does not trigger a refetch. Cached results may avoid a new simulated request.
- **Browser mock API:** MSW provides the requested API behavior without a backend deployment. Processing and the dataset remain in the browser, so this is a frontend demonstration rather than a remote production service.
- **Repeatable data:** seed `42` and a reference date of **7 October 2026** keep shared views and presets stable. Amounts use integer paise internally and display in INR; date filters include full days in IST.

## Tests and verification

```bash
bun run test
bun run check:data
bun run lint
bun run format:check
bun run build
bun run benchmark:orders
```

**121 tests across 9 files** passed in the latest verification. The important interaction cases are:

| Tests                                            | Behavior covered                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| [Explorer](tests/order-explorer.test.tsx)        | Late success/error responses cannot replace current results; URL filters, pagination, scroll, empty states, and retries. |
| [Search](tests/order-search.test.tsx)            | Debounce, IME composition, preserving drafts, and cancelling pending search on navigation.                               |
| [Drawer](tests/order-drawer.test.tsx)            | Independent failure/retry, direct links, Back/Forward, aborting details, Escape, and focus restoration.                  |
| [Virtualized table](tests/orders-table.test.tsx) | Bounded row count, saved offsets, Home/End, and Tab/Shift+Tab beyond the initial rendered window.                        |

`check:data` verifies all 10,000 orders, including unique IDs, totals, and timelines. `benchmark:orders` measures query processing with 5 warm-ups and 30 samples, excluding simulated latency.

Husky runs Oxlint and Prettier on staged files through lint-staged. Tests and builds run separately.

<details>
<summary>Browser checks, performance, and limitations</summary>

Local production Chrome checks covered refresh, shared links, Back/Forward, stale-request protection, error states, keyboard navigation, and layouts from 320px to 1,440px.

A 1,000-row page rendered at most 19 rows during scrolling without extra list requests. Median date-sort processing improved from about 73ms to 8ms locally. Measurements depend on the machine.

Axe reported no violations on the loaded list or drawer. Manual screen-reader testing and broader browser/device coverage remain pending. Lint retains two warnings for the shadcn button export and TanStack Virtual's React Compiler compatibility; React Compiler is disabled.

</details>

## Try the important flows

1. Search `Rahul`, choose a status, and apply filters. Sort by total, open an order, refresh, then close the drawer; check that the view is restored.
2. Change pages and use Back/Forward. Open the [1,000-row page](https://order-desk-lokeshwar.vercel.app/orders?pageSize=1000) and try Tab/Shift+Tab or Home/End in the table region.
3. New requests can fail intentionally. Use Retry; a detail failure should leave the list available. Automated tests exercise failures deterministically.

The demo video is optional according to the recruitment email and is not included.

## Deployment

Hosted on **Vercel**. Build command: `bun run build`; output directory: `dist`. [`vercel.json`](vercel.json) routes SPA deep links to `index.html`. The deployed `/orders` deep link and service-worker asset returned HTTP 200 after the routing fix.

## Sources and references

- [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) and [TanStack Virtual](https://tanstack.com/virtual/latest/docs/api/virtualizer): request signals, virtual ranges, and scroll behavior.
- [React Router](https://reactrouter.com/api/hooks/useSearchParams), [MSW browser integration](https://mswjs.io/guides/integrations/browser), and [Zod](https://zod.dev/basics): URL state, mock API startup, and runtime validation.
- [shadcn Sheet](https://ui.shadcn.com/docs/components/base/sheet) and [Base UI Dialog](https://base-ui.com/react/components/dialog): drawer primitives and focus management.
- [Vite](https://vite.dev/guide/) and [Vercel SPA routing](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas): local setup, production build, and deployment.

## AI usage

OpenAI Codex/ChatGPT assisted with planning, implementation, debugging, tests, performance checks, and documentation.

[View the ChatGPT requirements and architecture discussion](https://chatgpt.com/share/6ac8be35-ac28-83ec-b063-2ac54842d2d3). This is a follow-up discussion; the original development conversation has not been exported.

I also used **Google Antigravity (free plan) extensively for coding assistance**. **I was unable to export or generate an online share link for the Antigravity conversation.**
