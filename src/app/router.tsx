import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import { OrderExplorer } from "../features/orders/order-explorer"
function OrdersRedirect() {
  const location = useLocation()
  return <Navigate to={"/orders" + location.search} replace />
}
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/orders" element={<OrderExplorer />} />
        <Route path="*" element={<OrdersRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
