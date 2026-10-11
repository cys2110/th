import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "~/types/database.types"

export function parseCurrency(value: string) {
  return Number(value.replace(/[^0-9]/g, ""))
}

export function parseDate(value: string) {
  const numericDate = value.match(/(\d{4})[/.](\d{2})[/.](\d{2})/)

  if (numericDate) {
    const [, year, month, day] = numericDate

    return `${year}-${month}-${day}`
  }

  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
  const monthFirstDate = value.match(/\b([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})\b/)

  if (monthFirstDate) {
    const [, monthName, day, year] = monthFirstDate
    const monthIndex = months.indexOf(monthName!.toLowerCase())

    if (monthIndex >= 0) {
      const month = String(monthIndex + 1).padStart(2, "0")

      return `${year}-${month}-${day!.padStart(2, "0")}`
    }
  }

  const abbreviatedDate = value.match(/\b(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4}|\d{2})\b/)

  if (abbreviatedDate) {
    const [, day, monthName, parsedYear] = abbreviatedDate
    const monthIndex = months.indexOf(monthName!.toLowerCase())

    if (monthIndex >= 0) {
      const year =
        parsedYear!.length === 4 ? parsedYear
        : Number(parsedYear) >= 50 ? `19${parsedYear}`
        : `20${parsedYear}`
      const month = String(monthIndex + 1).padStart(2, "0")

      return `${year}-${month}-${day!.padStart(2, "0")}`
    }
  }

  throw new Error(`Unable to parse date from: ${value}`)
}

export function parseCoaches(value: string) {
  return value
    .split(/\s*(?:,|;|\band\b)\s*/i)
    .map(coach => coach.trim())
    .filter(Boolean)
}

export function parseHeight(value: string) {
  const match = value.match(/(\d+)\s*cm\b/i)

  if (!match) {
    if (/\(\s*cm\s*\)/i.test(value)) return null

    throw new Error(`Unable to parse height from: ${value}`)
  }

  return Number(match[1])
}

export function parseRank(value: string | null) {
  if (!value) return null

  const rank = Number(value)

  return Number.isNaN(rank) ? null : rank
}

export const parsePercentageStat = (value: string) => {
  const match = value.match(/(\d+)\s*\/\s*(\d+)/)

  const numerator = match ? Number(match[1]) : null
  const denominator = match ? Number(match[2]) : null

  return { numerator, denominator }
}

export const parseDuration = (value: string) => {
  return value ? value.replace(/(?:(\d+)h\s*)?(\d+)m/, (_, hours, minutes) => `${hours ?? "0"}:${minutes.padStart(2, "0")}:00`) : null
}

export const verifyExistingPlayers = async (supabase: SupabaseClient<Database>, players: Record<string, string>) => {
  const { data, error } = await supabase.schema("tennis").from("player").select("id").in("id", Object.keys(players))

  if (error || !data) {
    console.error("Error fetching players:", error)
    return {
      success: false,
      error: "Error fetching players"
    }
  }

  const playersNotInSupabase = players

  data.forEach(player => {
    if (player.id in playersNotInSupabase) {
      delete playersNotInSupabase[player.id]
    }
  })

  if (Object.keys(playersNotInSupabase).length) {
    const filePath = resolve(process.cwd(), "public/missing-players.json")

    const contents = await readFile(filePath, "utf8")

    const parsedPlayers: Record<string, string> | Array<{ id: string; name: string }> = contents.trim() ? JSON.parse(contents) : {}

    const existingPlayers = Array.isArray(parsedPlayers) ? Object.fromEntries(parsedPlayers.map(({ id, name }) => [id, name])) : parsedPlayers

    const missingPlayers = { ...existingPlayers, ...players }

    await writeFile(filePath, `${JSON.stringify(missingPlayers, null, 2)}\n`)
  }

  return {
    success: true,
    playersNotInSupabase,
    count: Object.keys(playersNotInSupabase).length
  }
}
