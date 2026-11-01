import { chromium, Page } from "playwright"
import { Database } from "~/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

interface Stats {
  t1: { [key: string]: number }
  t2: { [key: string]: number }
}

const stats_dictionary = {
  aces: "aces",
  "double faults": "dfs",
  "1st serve points won": ["serve1_w", "serve1", "ret1_w", "ret1"],
  "2nd serve points won": ["serve2_w", "serve2", "ret2_w", "ret2"],
  "break points saved": ["bps_saved", "bps_faced", "bps_converted", "bp_opps"],
  "net points won": ["net_w", "net"],
  winners: "winners",
  "unforced errors": "ues",
  "max speed": "max_speed",
  "1st serve average speed": "avg1_speed",
  "2nd serve average speed": "avg2_speed",
  "service games played": "serve_games",
  "return games played": "return_games"
}

export async function scrapeAtpMatch(supabase: SupabaseClient<Database>, href: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const page = await browser.newPage()

    await page.goto(href, { waitUntil: "domcontentloaded" })

    await page.pause()

    await acceptAtpCookies(page)

    const RGMatchStats = page.locator("div.RGMatchStats")

    const isNewMatch = (await RGMatchStats.count()) > 1

    console.log("is new match", isNewMatch)

    // const stats = await (isNewMatch ? scrapeNewMatch : scrapeOldMatch)(page)
    const stats = await scrapeNewMatch(page)

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
          entry_id: matchData[isNewMatch ? "team_1_id" : "winner_id"]!
        },
        {
          ...stats.t2,
          match_id: matchData.id,
          entry_id: matchData[isNewMatch ? "team_2_id" : "loser_id"]!
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

    return { success: true, stats }
  } finally {
    await browser.close()
  }
}

const scrapeNewMatch = async (page: Page) => {
  const stats: Stats = {
    t1: {},
    t2: {}
  }

  const statsWrappers = await page.locator(".statTileWrapper").all()

  for (const wrapper of statsWrappers) {
    const label = (await wrapper.locator(".labelWrapper").innerText()).toLowerCase()

    if (label in stats_dictionary) {
      const statKeys = stats_dictionary[label as keyof typeof stats_dictionary]

      if (label.includes("speed")) {
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

  return stats
}

const scrapeOldMatch = async (page: Page) => {
  const stats: Stats = {
    t1: {},
    t2: {}
  }

  const statsGroupItems = page.locator("div.stats-group-items")

  const statsItems = await statsGroupItems.locator("li").all()

  for (const item of statsItems) {
    const label = (await item.locator("div.stats-item-legend").innerText()).toLowerCase()

    if (label in stats_dictionary) {
      const statKeys = stats_dictionary[label as keyof typeof stats_dictionary]

      if (label.includes("speed")) {
        throw new Error("No speed")
        // const team1Stat = await getParentText(wrapper.locator(".speedkmh1").first())
        // const team2Stat = await getParentText(wrapper.locator(".speedkmh2").first())

        // if (!Array.isArray(statKeys)) {
        //   if (team1Stat) {
        //     stats.t1[statKeys] = Number(team1Stat)
        //   }

        //   if (team2Stat) {
        //     stats.t2[statKeys] = Number(team2Stat)
        //   }
        // }
      } else {
        if (Array.isArray(statKeys)) {
          const team1Stat = await item.locator(".player-stats-item .value span").innerText()
          const team2Stat = await item.locator(".opponent-stats-item .value span").innerText()

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
          const team1Stat = await item.locator(".player-stats-item .value").innerText()
          const team2Stat = await item.locator(".opponent-stats-item .value").innerText()

          stats.t1[statKeys] = Number(team1Stat)

          stats.t2[statKeys] = Number(team2Stat)
        }
      }
    }
  }

  return stats
}
