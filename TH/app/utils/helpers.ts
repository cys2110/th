import { type Row } from "@tanstack/vue-table"

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

export const formatAtpLink = (link: string) => {
  if (!link.startsWith("https://www.atptour.com")) {
    return `https://www.atptour.com${link}`
  }
  return link
}

export const arrayFilter = (row: Row<any>, columnId: string, filterValue: string[]) => {
  const values = (row.getValue(columnId) as string[]) || []

  if (!filterValue.length) return true
  if (values.some(v => filterValue.includes(v))) return true

  return false
}

export const calculatePercentage = (value1: number, value2: number, decimalPlaces?: number) => {
  const decimal = decimalPlaces || 0
  let percentage = 0

  if (value2) percentage = (value1 / value2) * 100

  return Number(percentage.toFixed(decimal))
}

// Generics
export const isLaverWinner = (item: EditionWinnerType): item is LaverCupWinnerInterface => "team_name" in item

export const isCountryWinner = (item: EditionWinnerType): item is CountryWinnerInterface => "country" in item

export const isEliminationWinner = (item: EditionWinnerType): item is EliminationWinnerInterface => "tour" in item
