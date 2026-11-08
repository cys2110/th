import type { ColumnFiltersState } from "@tanstack/vue-table"
import { isDefined } from "@vueuse/core"

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smaller("xl")

export const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
})

export const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  timeZone: "UTC"
})

export const formatDate = (start_date: Date | string, end_date?: Date | string | null) => {
  const startDate = typeof start_date === "string" ? new Date(start_date) : start_date

  if (end_date) {
    const endDate = typeof end_date === "string" ? new Date(end_date) : end_date
    return lgAndDown.value ? shortDateFormat.formatRange(startDate, endDate) : dateFormat.formatRange(startDate, endDate)
  } else {
    return lgAndDown.value ? shortDateFormat.format(startDate) : dateFormat.format(startDate)
  }
}

export const formatCurrency = (value: number, currency?: string | null) =>
  value.toLocaleString("en-GB", { style: "currency", currency: currency || "USD" })

export const getTournamentType = (tournamentName: string) => {
  if (tournamentName === "laver-cup") return "laver"

  if (["davis-cup", "atp-cup", "united-cup", "billie-jean-king-cup"].includes(tournamentName)) return "country"

  return "elimination"
}

export const percentage = (value: number, total: number, decimals = 0) =>
  total === 0 ? 0 : Number(((value / total) * 100).toFixed(Math.max(0, decimals)))

export const convertKmhToMph = (kmh: number) => {
  return Math.round(kmh * 0.621371)
}

export const getColumnFilter = (id: string, columnFilters: ColumnFiltersState) => columnFilters.find(filter => filter.id === id)?.value

export const setColumnFilter = (id: string, value: unknown, columnFilters: ColumnFiltersState) => [
  ...columnFilters.filter(filter => filter.id !== id),
  ...(isDefined(value) && value !== "" ? [{ id, value }] : [])
]

export const prettifyJson = (data: Record<any, any> | Array<Record<any, any>>) =>
  JSON.stringify(
    data,
    (_, value) => {
      const string = value

      if (string === undefined) {
        return "<em class='text-ATP'>undefined</em>"
      }

      if (string === null) {
        return "<em class='text-info'>null</em>"
      }

      return string
    },
    2
  ).replace(/"(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, token => {
    const escaped = token.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    if (token.endsWith(":")) return escaped

    if (token.startsWith('"')) {
      const value = JSON.parse(token)
      if (value === "<em class='text-ATP'>undefined</em>" || value === "<em class='text-info'>null</em>") return value

      return `<span class="text-primary">${escaped}</span>`
    }

    return `<span class="text-Tour">${token}</span>`
  })
