import { chromium } from "playwright"
import type { Browser } from "playwright"
import type { Database } from "~/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

type Activity = {
  points: number
  ranking: number
  prizeMoney: number
}

const NAVIGATION_DELAY = {
  min: 2000,
  max: 5000
}

const getNavigationDelay = () => Math.floor(Math.random() * (NAVIGATION_DELAY.max - NAVIGATION_DELAY.min + 1)) + NAVIGATION_DELAY.min

const parseTournamentFooter = (footer: string): Activity | null => {
  const values = footer.match(/Points:\s*([\d,]+).*?ATP Ranking:\s*([\d,]+).*?Prize Money:\s*\$?([\d,]+(?:\.\d+)?)/i)

  if (!values?.[1] || !values[2] || !values[3]) return null

  return {
    points: Number(values[1].replaceAll(",", "")),
    ranking: Number(values[2].replaceAll(",", "")),
    prizeMoney: Number(values[3].replaceAll(",", ""))
  }
}

const scrapeActivity = async (browser: Browser, playerId: string, matchType: "Singles" | "Doubles", tournamentId: string, year: string) => {
  const page = await browser.newPage()

  try {
    await page.waitForTimeout(getNavigationDelay())

    await page.goto(`https://www.atptour.com/en/players/x/${playerId}/player-activity?year=${year}&matchType=${matchType}`, {
      waitUntil: "domcontentloaded"
    })

    await acceptAtpCookies(page)

    const tournamentContainers = await page.locator(".tournament").all()

    for (const container of tournamentContainers) {
      const linkWrapper = container.locator(".schedule").locator("a")
      const link = await linkWrapper.getAttribute("href")

      if (!link) continue

      const tournamentPath = new URL(link, page.url()).pathname.split("/").filter(Boolean)

      if (!tournamentPath.includes(tournamentId)) continue

      const tournamentFooter = container.locator("+ .tournament-footer")

      if ((await tournamentFooter.count()) === 0) {
        throw new Error(`Tournament footer not found for tournament ${tournamentId}`)
      }

      const activity = parseTournamentFooter(await tournamentFooter.innerText())

      if (!activity) {
        throw new Error(`Unable to parse tournament footer for tournament ${tournamentId}`)
      }

      return activity
    }

    throw new Error(`Tournament ${tournamentId} not found on ${matchType.toLowerCase()} activity page`)
  } finally {
    await page.close()
  }
}

export async function scrapeAtpActivity(supabase: SupabaseClient<Database>, tournamentId: string, year: string, editionNo: string) {
  const browser = await chromium.launch({ headless: false })

  const errors: Array<{ player_id: string; error: string }> = []

  try {
    const { data: eventsData, error: eventsError } = await supabase
      .schema("tennis")
      .from("editions")
      .select("id, events!inner(id), tournament!inner(id)")
      .eq("tournament.mens_id", Number(tournamentId))
      .eq("year", Number(year))
      .eq("edition_no", Number(editionNo))
      .eq("events.tour", "ATP")
      .single()

    if (eventsError || !eventsData) {
      console.error("Error fetching events:", eventsError)
      return {
        success: false,
        error: "Error fetching events"
      }
    }

    const eventId = eventsData.events[0]?.id

    if (!eventId) {
      return {
        success: false,
        error: "ATP event not found for edition"
      }
    }

    const { data: playersData, error: playersError } = await supabase
      .schema("tennis")
      .from("player_entry_mapping")
      .select("id, player_id, ...entries!inner(entry_id:id, match_type), player!inner(tour)")
      .is("rank", null)
      .eq("entries.event_id", eventId)
      .eq("player.tour", "ATP")

    if (playersError || !playersData) {
      console.error("Error fetching players:", playersError)
      return {
        success: false,
        error: "Error fetching players"
      }
    }

    for (const player of playersData) {
      if (player.match_type !== "Singles" && player.match_type !== "Doubles") continue

      try {
        const result = await scrapeActivity(browser, player.player_id, player.match_type, tournamentId, year)

        const [{ error: entryError }, { error: pemError }] = await Promise.all([
          supabase.schema("tennis").from("entries").update({ points: result.points, pm: result.prizeMoney }).eq("id", player.entry_id),
          supabase.schema("tennis").from("player_entry_mapping").update({ rank: result.ranking }).eq("id", player.id)
        ])

        if (entryError) {
          errors.push({ player_id: player.player_id, error: `Error updating entry: ${entryError.message}` })
        }

        if (pemError) {
          errors.push({ player_id: player.player_id, error: `Error updating pem: ${pemError.message}` })
        }
      } catch (error) {
        errors.push({
          player_id: player.player_id,
          error: error instanceof Error ? error.message : "Unknown activity scrape error"
        })
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: "Error updating player entries",
        errors
      }
    }

    return {
      success: true
    }
  } finally {
    await browser.close()
  }
}
