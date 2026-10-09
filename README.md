# Order Desk

A fast, searchable explorer for **10,000 sample orders**, built for Problem Statement 1.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?logo=vercel)](https://order-desk-lokeshwar.vercel.app) ![React](https://img.shields.io/badge/React-19-149ECA?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white) ![Tests](https://img.shields.io/badge/Tests-121_passing-16803D)

**[Open live demo ↗](https://order-desk-lokeshwar.vercel.app)** · **[GitHub repository](https://github.com/lokeshwardewangan/order-desk)**

## ✨ Features

- Search by order ID, name, or email; combine status, date, and amount filters.
- Sortable, paginated, virtualized table with keyboard navigation.
- Shareable URLs restore filters, page, scroll, and the order details drawer.
- Debounced search, request cancellation, and protection against stale results.
- Loading, empty, error, and retry states; detail failures leave the list available.
- MSW mock API with **200–3,000ms latency** and **10% random failures**.

## 🚀 Run locally

Tested with Node.js 22.18 and Bun 1.3.4. No API keys or separate backend needed.

```bash
git clone https://github.com/lokeshwardewangan/order-desk.git
cd order-desk
bun install --frozen-lockfile
bun run dev
```

Open the URL printed by Vite. For a production preview: `bun run build`, then `bun run preview`.

## Implementation

| Area          | Choice                                                     |
| ------------- | ---------------------------------------------------------- |
| UI            | React, TypeScript, Tailwind CSS, shadcn/ui + Base UI       |
| Applied state | React Router URL parameters; local state for filter drafts |
| Requests      | TanStack Query, separate list/detail keys, abort signals   |
| Large lists   | TanStack Virtual; 100 rows per page, up to 1,000 via URL   |
| Validation    | Zod schemas for query parameters and API responses         |
| Mock API      | MSW; search/filter/sort before pagination                  |

**Tradeoffs:** pagination makes navigation and restoration predictable. Fixed row heights keep virtualization simple. Automatic retries are disabled so failures remain visible; users retry explicitly. Cached responses stay fresh for 30 seconds.

Amounts use integer paise internally and display in INR. Date filters use IST. Sample dates are fixed around **7 October 2026**, keeping presets repeatable.

<details>
<summary>Folder structure</summary>

```text
src/app/                   Router and providers
src/components/ui/         Shared UI primitives
src/features/orders/       Components, hooks, schemas, services, and utils
src/mocks/orders/          Dataset and mock API
tests/                     API and interaction tests
scripts/                   Dataset checks and benchmarks
```

</details>

## Checks

```bash
bun run test               # 121 tests across 9 files
bun run check:data         # Verify 10,000 deterministic orders
bun run lint
bun run format:check
bun run build
bun run benchmark:orders
```

Tests cover debounce, cancellation, late responses, URL restoration, validation, independent detail retries, and virtualized keyboard navigation. Husky runs Oxlint and Prettier on staged files through lint-staged.

Local Chrome checks covered layouts from 320px to 1,440px. A 1,000-row page rendered at most 19 rows while scrolling. Date-sort processing improved from ~73ms to ~8ms locally; results vary by machine.

**Try it:** search `Rahul`, apply a status, open an order, refresh, then close the drawer. Check Back/Forward and keyboard navigation. Use [`?pageSize=1000`](https://order-desk-lokeshwar.vercel.app/orders?pageSize=1000) to explore virtualization. Random failures are intentional—use Retry.

<details>
<summary>Deployment and check notes</summary>

Hosted on Vercel. Build command: `bun run build`; output: `dist`. `vercel.json` provides the SPA fallback for direct `/orders` links; redeploy after adding this configuration. MSW remains enabled in production and requires HTTPS or localhost.

Lint retains two warnings: the shadcn button export and TanStack Virtual's React Compiler compatibility. React Compiler is disabled. Axe found no violations on the loaded list or drawer; manual screen-reader testing remains pending.

</details>

## References

[Vite](https://vite.dev/guide/) · [Vercel SPA routing](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas) · [Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) · [Virtualizer](https://tanstack.com/virtual/latest/docs/api/virtualizer) · [React Router](https://reactrouter.com/api/hooks/useSearchParams) · [MSW](https://mswjs.io/guides/integrations/browser) · [Zod](https://zod.dev/basics) · [shadcn Sheet](https://ui.shadcn.com/docs/components/base/sheet) · [Base UI Dialog](https://base-ui.com/react/components/dialog)

## AI usage

OpenAI Codex/ChatGPT assisted with planning, implementation, debugging, tests, performance checks, and documentation.

[View the ChatGPT requirements and architecture discussion](https://chatgpt.com/share/6ac8be35-ac28-83ec-b063-2ac54842d2d3). This is a follow-up discussion; the original development conversation has not been exported.

I also used **Google Antigravity (free plan) extensively for coding assistance**. **I was unable to export or generate an online share link for the Antigravity conversation.**
