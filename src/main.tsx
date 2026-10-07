import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

const root = createRoot(document.getElementById("root")!)

async function startApp() {
  try {
    const { worker } = await import("./mocks/browser")
    await worker.start({
      onUnhandledFrame: "bypass",
      quiet: true,
      serviceWorker: { url: import.meta.env.BASE_URL + "mockServiceWorker.js" },
    })
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error("Order Desk startup failed", error)
    root.render(
      <main role="alert" className="mx-auto max-w-lg p-8">
        <h1 className="text-xl font-semibold">Order Desk could not start</h1>
        <p className="mt-2">Refresh the page to try again.</p>
        <button
          className="mt-4 rounded-md border px-4 py-2 focus-visible:outline-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </main>,
    )
  }
}

void startApp()
