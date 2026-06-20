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
