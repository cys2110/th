import { type Row } from "@tanstack/vue-table"

export const cleanLink = (link: string) => link.replaceAll(/^[\s"'“”‘’\[\]]+|[\s"'“”‘’\[\]]+$/g, "").replace("https://www.atptour.com", "")

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

export const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
  hour: "numeric",
  minute: "numeric"
})

export const shortDateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  timeZone: "UTC",
  hour: "numeric",
  minute: "numeric"
})

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smaller("xl")

export const formatDate = (start_date: Date | string, end_date?: Date | string) => {
  const startDate = typeof start_date === "string" ? new Date(start_date) : start_date

  if (end_date) {
    const endDate = typeof end_date === "string" ? new Date(end_date) : end_date
    return lgAndDown.value ? shortDateFormat.formatRange(startDate, endDate) : dateFormat.formatRange(startDate, endDate)
  } else {
    return lgAndDown.value ? shortDateFormat.format(startDate) : dateFormat.format(startDate)
  }
}

export const formatDateTime = (start_date: Date | string, end_date?: Date | string) => {
  const startDate = typeof start_date === "string" ? new Date(start_date) : start_date

  if (end_date) {
    const endDate = typeof end_date === "string" ? new Date(end_date) : end_date
    return lgAndDown.value ? shortDateTimeFormat.formatRange(startDate, endDate) : dateTimeFormat.formatRange(startDate, endDate)
  } else {
    return lgAndDown.value ? shortDateTimeFormat.format(startDate) : dateTimeFormat.format(startDate)
  }
}

/** Function to convert centimetres to ft & inches */
export const convertToFt = (height: number) => {
  const ftDecimal = convert(height, "cm").to("ft")
  const ft = Math.floor(ftDecimal)
  const inches = Math.round((ftDecimal - ft) * 12)
  return `${ft}' ${inches}"`
}

/** Function to convert kilometres per hour to miles per hour */
export const convertKmhToMph = (kmh: number) => {
  return Math.round(kmh * 0.621371)
}

export const do_n_times = (n: number, cb: () => void) => {
  for (let i = 0; i < n; i++) {
    cb()
  }
}

export const getAge = (dob: Date, dod?: Date) => {
  const endDate = dod || new Date()

  let years = endDate.getFullYear() - dob.getFullYear()
  let months = endDate.getMonth() - dob.getMonth()
  let days = endDate.getDate() - dob.getDate()

  if (days < 0) {
    months--
    days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  return lgAndDown.value ? `${years}y, ${months}m, ${days}d` : `${years} years, ${months} months, ${days} days`
}

export const percentage = (value1: number, value2: number) => (value2 === 0 ? 0 : Math.round((value1 / value2) * 100))

export const arrayFilter = (row: Row<any>, columnId: string, filterValue: string[]) => {
  const values = (row.getValue(columnId) as string[]) || []

  if (!filterValue.length) return true
  if (values.some(v => filterValue.includes(v))) return true

  return false
}

export const numberFilter = (row: Row<any>, columnId: string, filterValue: number[]) => {
  const value = row.getValue(columnId) as number

  if (!filterValue.length) return true
  if (filterValue.includes(value)) return true

  return false
}
