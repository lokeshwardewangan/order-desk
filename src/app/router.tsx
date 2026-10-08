import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import { lazy, Suspense } from "react"
const OrderExplorer = lazy(() =>
  import("../features/orders/order-explorer").then((module) => ({
    default: module.OrderExplorer,
  })),
)
function OrdersRedirect() {
  const location = useLocation()
  return <Navigate to={"/orders" + location.search} replace />
}
export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <p role="status" className="p-8 text-center text-muted-foreground">
            Loading Order Desk…
          </p>
        }
      >
        <Routes>
          <Route path="/orders" element={<OrderExplorer />} />
          <Route path="*" element={<OrdersRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
