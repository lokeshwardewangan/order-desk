import { setupWorker } from "msw/browser"
import { handlers } from "./orders/handlers"

export const worker = setupWorker(...handlers)
