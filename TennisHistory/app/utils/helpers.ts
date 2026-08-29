export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

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
