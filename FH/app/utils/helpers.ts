export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
})

export const formatDate = (start_date: Date | string, end_date?: Date | string | null) => {
  const startDate = typeof start_date === "string" ? new Date(start_date) : start_date

  if (end_date) {
    const endDate = typeof end_date === "string" ? new Date(end_date) : end_date
    return dateFormat.formatRange(startDate, endDate)
  } else {
    return dateFormat.format(startDate)
  }
}

export const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "numeric"
})

export const formatDateTime = (start_date: Date | string, end_date?: Date | string) => {
  const startDate = typeof start_date === "string" ? new Date(start_date) : start_date

  if (end_date) {
    const endDate = typeof end_date === "string" ? new Date(end_date) : end_date
    return dateTimeFormat.formatRange(startDate, endDate)
  } else {
    return dateTimeFormat.format(startDate)
  }
}
