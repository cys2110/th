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

/** Function to get flag icon for country */
export const getFlagCode = (country: CountryType) => {
  const circleFlagsMapping: Record<typeof country.id, string> = {
    URS: "soviet-union",
    YUG: "yu",
    TCH: "cs",
    NMI: "mp"
  }

  if (country.id in circleFlagsMapping) {
    return `circle-flags:${circleFlagsMapping[country.id]}`
  } else if (!country.alpha_2) {
    if (country.id === "POC") {
      return "flag:pc-4x3"
    }
    return `twemoji:flag-${kebabCase(country.name)}`
  } else if (["ch", "np"].includes(country.alpha_2)) {
    return `flag:${country.alpha_2}-1x1`
  }
  return `flag:${country.alpha_2}-4x3`
}

export const percentage = (value1: number, value2: number) => (value2 === 0 ? 0 : Math.round((value1 / value2) * 100))
