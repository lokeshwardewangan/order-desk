const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})
const date = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
})
const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
})
export const formatAmount = (paise: number) => currency.format(paise / 100)
export const formatOrderDate = (value: string) => date.format(new Date(value))
export const formatOrderDateTime = (value: string) =>
  dateTime.format(new Date(value))
