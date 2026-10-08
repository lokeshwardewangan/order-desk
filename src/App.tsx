import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import { OrderExplorer } from "./features/orders/order-explorer"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

function OrdersRedirect() {
  const location = useLocation()
  return <Navigate to={"/orders" + location.search} replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/orders" element={<OrderExplorer />} />
          <Route path="*" element={<OrdersRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
