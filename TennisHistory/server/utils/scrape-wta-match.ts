import { chromium } from "playwright"
import { Database } from "~/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

const MATCH_INFO_CATEGORIES = {
  "Start Time": "date",
  Court: "court"
} as const

type NumericStatsKey = {
  [K in keyof StatsInsert]-?: NonNullable<StatsInsert[K]> extends number ? K : never
}[keyof StatsInsert]

const STATS_CATEGORIES: Record<string, NumericStatsKey | NumericStatsKey[]> = {
  Aces: "aces",
  "Double Faults": "dfs",
  "1st Serves Won %": ["serve1_w", "serve1"],
  "2nd Serve Points Won %": ["serve2_w", "serve2"],
  "Break Points Saved %": ["bps_saved", "bps_faced"],
  "Service Games Played": "serve_games",
  "Break Points Converted %": ["bps_converted", "bp_opps"],
  "1st Return Points Won": ["ret1_w", "ret1"],
  "2nd Return Points Won": ["ret2_w", "ret2"],
  "Return Games Played": "return_games"
} as const

export async function scrapeWtaMatch(supabase: SupabaseClient<Database>, href: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const { data: matchData, error: matchError } = await supabase
      .schema("tennis")
      .from("matches")
      .select("id, team_1_id, team_2_id")
      .eq("match_link", href)
      .single()

    if (matchError || !matchData) {
      console.error("Error fetching match data", matchError)
      return {
        success: false,
        error: matchError || "Error fetching match data"
      }
    }

    const page = await browser.newPage()

    await page.goto(href, { waitUntil: "domcontentloaded" })

    // await page.pause()

    await acceptWtaCookies(page)

    let date = null
    let court = null
    let duration = null

    const matchInfoRows = await page.locator("div.mc-match-info__row").all()

    for (const row of matchInfoRows) {
      const category = await row.locator("div.mc-match-info__title").innerText()

      if (category in MATCH_INFO_CATEGORIES) {
        const value = await row.locator("div.mc-match-info__value").innerText()

        if (category === "Court") {
          court = value
        } else {
          date = parseDate(value)
        }
      }
    }

    const matchTime = await page.locator("div.tennis-match__status-time").first().innerText()
    duration = `${matchTime.replace("Finished: ", "")}:00`

    await page.getByRole("tab", { name: "Stats" }).click()

    await page.waitForTimeout(5000)

    const t1Stats: Partial<StatsInsert> = {
      match_id: matchData.id,
      entry_id: matchData.team_1_id!
    }

    const t2Stats: Partial<StatsInsert> = {
      match_id: matchData.id,
      entry_id: matchData.team_2_id!
    }

    const shotsItems = await page.locator("div.mc-shot-radial-stats__item").all()

    for (const item of shotsItems) {
      const category = await item.getAttribute("aria-label")

      if (!category) {
        continue
      }

      if (category === "Winners" || category === "Unforced Errors") {
        const t1Value = await item.locator("span.mc-shot-radial-stats__value--a").innerText()
        const t2Value = await item.locator("span.mc-shot-radial-stats__value--b").innerText()

        t1Stats[category === "Winners" ? "winners" : "ues"] = Number(t1Value)
        t2Stats[category === "Winners" ? "winners" : "ues"] = Number(t2Value)
      }
    }

    const statsPanel = page.locator("div.mc-stats-panel:visible").filter({
      has: page.getByRole("button", { name: "Returning", exact: true })
    })

    await statsPanel.getByRole("button", { name: "Serving", exact: true }).click()
    await statsPanel
      .locator("div.stats-table__row-label")
      .filter({ hasText: /^Service Games Played$/ })
      .waitFor({ state: "visible" })

    const statsRows = await statsPanel.locator("div.stats-table__row").all()

    for (const row of statsRows) {
      const label = await row.locator("div.stats-table__row-label").innerText()

      if (label in STATS_CATEGORIES) {
        const categories = STATS_CATEGORIES[label]!

        const t1Container = row.locator("div.stats-table__row-value--0")
        const t2Container = row.locator("div.stats-table__row-value--1")

        if (Array.isArray(categories)) {
          const t1Ratio = (await t1Container.locator("div.stats-table__row-value-text--secondary").innerText()).trim()
          const [t1Numerator, t1Denominator] = t1Ratio.split("/")
          const t2Ratio = (await t2Container.locator("div.stats-table__row-value-text--secondary").innerText()).trim()
          const [t2Numerator, t2Denominator] = t2Ratio.split("/")

          t1Stats[categories[0]!] = Number(t1Numerator)
          t1Stats[categories[1]!] = Number(t1Denominator)
          t2Stats[categories[0]!] = Number(t2Numerator)
          t2Stats[categories[1]!] = Number(t2Denominator)
        } else {
          const t1Value = await t1Container.innerText()
          const t2Value = await t2Container.innerText()

          t1Stats[categories] = Number(t1Value)
          t2Stats[categories] = Number(t2Value)
        }
      }
    }

    const returningButton = statsPanel.getByRole("button", { name: "Returning", exact: true })
    await returningButton.scrollIntoViewIfNeeded()
    await returningButton.click()
    await statsPanel
      .locator("div.stats-table__row-label")
      .filter({ hasText: /^Return Games Played$/ })
      .waitFor({ state: "visible" })

    const returnStatsRows = await statsPanel.locator("div.stats-table__row").all()

    for (const row of returnStatsRows) {
      const label = await row.locator("div.stats-table__row-label").innerText()

      if (label in STATS_CATEGORIES) {
        const categories = STATS_CATEGORIES[label]!

        const t1Container = row.locator("div.stats-table__row-value--0")
        const t2Container = row.locator("div.stats-table__row-value--1")

        if (Array.isArray(categories)) {
          const t1Ratio = (await t1Container.locator("div.stats-table__row-value-text--secondary").innerText()).trim()
          const [t1Numerator, t1Denominator] = t1Ratio.split("/")
          const t2Ratio = (await t2Container.locator("div.stats-table__row-value-text--secondary").innerText()).trim()
          const [t2Numerator, t2Denominator] = t2Ratio.split("/")

          t1Stats[categories[0]!] = Number(t1Numerator)
          t1Stats[categories[1]!] = Number(t1Denominator)
          t2Stats[categories[0]!] = Number(t2Numerator)
          t2Stats[categories[1]!] = Number(t2Denominator)
        } else {
          const t1Value = await t1Container.innerText()
          const t2Value = await t2Container.innerText()

          t1Stats[categories] = Number(t1Value)
          t2Stats[categories] = Number(t2Value)
        }
      }
    }

    const { error: matchUpdateError } = await supabase
      .schema("tennis")
      .from("matches")
      .update({
        date,
        court,
        duration
      })
      .eq("id", matchData.id)

    if (matchUpdateError) {
      console.error("Error updating match", matchUpdateError)
    }

    const { error: statsError } = await supabase
      .schema("tennis")
      .from("match_stats")
      .insert([t1Stats as StatsInsert, t2Stats as StatsInsert])

    if (statsError) {
      console.error("Error inserting match stats", statsError)
      return {
        success: false,
        error: statsError || "Error inserting match stats"
      }
    }

    return {
      success: true,
      date,
      court,
      duration,
      t1Stats,
      t2Stats
    }
  } finally {
    await browser.close()
  }
}
