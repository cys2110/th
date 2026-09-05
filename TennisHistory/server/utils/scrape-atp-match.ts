import { chromium } from "playwright"
import { Database } from "~/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function scrapeAtpMatch(supabase: SupabaseClient<Database>, href: string) {
  const browser = await chromium.launch({ headless: false })

  const stats_dictionary = {
    Aces: "aces",
    "Double Faults": "dfs",
    "1st serve points won": ["serve1_w", "serve1", "ret1_w", "ret1"],
    "2nd serve points won": ["serve2_w", "serve2", "ret2_w", "ret2"],
    "Break Points Saved": ["bps_saved", "bps_faced", "bps_converted", "bp_opps"],
    "Net points won": ["net_w", "net"],
    Winners: "winners",
    "Unforced Errors": "ues",
    "Max Speed": "max_speed",
    "1st Serve Average Speed": "avg1_speed",
    "2nd Serve Average Speed": "avg2_speed",
    "Service Games Played": "serve_games",
    "Return Games Played": "return_games"
  }

  try {
    const page = await browser.newPage()

    await page.goto(href, { waitUntil: "domcontentloaded" })

    await acceptAtpCookies(page)

    const stats: { t1: { [key: string]: number }; t2: { [key: string]: number } } = {
      t1: {},
      t2: {}
    }

    const statsWrappers = await page.locator(".statTileWrapper").all()

    for (const wrapper of statsWrappers) {
      const label = await wrapper.locator(".labelWrapper").innerText()

      if (label in stats_dictionary) {
        const statKeys = stats_dictionary[label as keyof typeof stats_dictionary]

        if (label.includes("Speed")) {
          const team1Stat = await getParentText(wrapper.locator(".speedkmh1").first())
          const team2Stat = await getParentText(wrapper.locator(".speedkmh2").first())

          if (!Array.isArray(statKeys)) {
            if (team1Stat) {
              stats.t1[statKeys] = Number(team1Stat)
            }

            if (team2Stat) {
              stats.t2[statKeys] = Number(team2Stat)
            }
          }
        } else {
          const team1Stat = await wrapper.locator(".player1").first().innerText()
          const team2Stat = await wrapper.locator(".player2").first().innerText()

          if (Array.isArray(statKeys)) {
            if (team1Stat) {
              const { numerator, denominator } = parsePercentageStat(team1Stat)

              if (numerator) {
                stats.t1[statKeys[0]!] = numerator
              }

              if (denominator) {
                stats.t1[statKeys[1]!] = denominator

                if (statKeys[3]) {
                  stats.t2[statKeys[3]] = denominator
                }

                if (numerator) {
                  if (statKeys[2]) {
                    stats.t2[statKeys[2]] = denominator - numerator
                  }
                }
              }
            }

            if (team2Stat) {
              const { numerator, denominator } = parsePercentageStat(team2Stat)

              if (numerator) {
                stats.t2[statKeys[0]!] = numerator
              }

              if (denominator) {
                stats.t2[statKeys[1]!] = denominator

                if (statKeys[3]) {
                  stats.t1[statKeys[3]] = denominator
                }

                if (numerator) {
                  if (statKeys[2]) {
                    stats.t1[statKeys[2]] = denominator - numerator
                  }
                }
              }
            }
          } else {
            if (team1Stat) {
              stats.t1[statKeys] = Number(team1Stat)
            }

            if (team2Stat) {
              stats.t2[statKeys] = Number(team2Stat)
            }
          }
        }
      }
    }

    if (Object.values(stats.t1).length === 0 || Object.values(stats.t2).length === 0) {
      return {
        success: false,
        error: "No stats found",
        response: stats,
        href
      }
    }

    const { data: matchData, error: matchError } = await supabase
      .schema("tennis")
      .from("matches")
      .select("id, team_1_id, team_2_id, winner_id, loser_id")
      .eq("match_link", href)
      .single()

    if (matchError || !matchData) {
      console.error("Error inserting match:", matchError)
      return {
        success: false,
        error: "Error inserting match",
        response: matchError,
        href
      }
    }

    // Delete any existing match stats
    await supabase.schema("tennis").from("match_stats").delete().eq("match_id", matchData.id)

    const { error: insertError } = await supabase
      .schema("tennis")
      .from("match_stats")
      .insert([
        {
          ...stats.t1,
          match_id: matchData.id,
          entry_id: matchData.team_1_id!
        },
        {
          ...stats.t2,
          match_id: matchData.id,
          entry_id: matchData.team_2_id!
        }
      ])

    if (insertError) {
      return {
        success: false,
        error: "Error inserting match stats",
        response: insertError,
        href
      }
    }

    return { success: true }
  } finally {
    await browser.close()
  }
}
