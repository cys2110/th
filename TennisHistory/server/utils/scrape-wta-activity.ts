import type { Browser } from "playwright"

const ACTIVITY_CATEGORIES = {
  "Rank:": "rank",
  "WTA Points Gain:": "points",
  "Prize Money Won:": "pm"
} as const

export async function scrapeWtaActivity(browser: Browser, playerId: string, matchType: MatchTypeEnum, tournamentId: string, year: string) {
  const page = await browser.newPage()

  const activity: Partial<ActivityResult> = {
    player_id: playerId
  }

  try {
    const activityUrl = `https://www.wtatennis.com/players/${playerId}/x/matches?year=${year}&tournament=${tournamentId}${matchType === "Doubles" ? "&type=D" : ""}`

    try {
      await page.goto(activityUrl, { waitUntil: "domcontentloaded" })
    } catch (error) {
      console.error("WTA activity navigation failed", { playerId, matchType, activityUrl, currentUrl: page.url(), error })

      // Keep navigation failures available for inspection before cleanup.
      if (!page.isClosed()) {
        await page.pause()
      }

      throw error
    }

    await page.waitForTimeout(2000)

    await page.waitForSelector("div.player-matches__tournament-footer")

    const metaItems = await page.locator("div.player-matches__tournament-meta-item").all()

    for (const item of metaItems) {
      const label = await item.locator("span.player-matches__tournament-meta-label").first().innerText()

      if (label in ACTIVITY_CATEGORIES) {
        const category = ACTIVITY_CATEGORIES[label as keyof typeof ACTIVITY_CATEGORIES]

        const value = await item.locator("span.player-matches__tournament-meta-value").innerText()

        if (category === "rank") {
          activity.rank = Number(value)
        } else if (category === "points") {
          activity.points = Number(value.replace("+", ""))
        } else if (category === "pm") {
          activity.pm = parseCurrency(value)
        }
      }
    }

    return activity as ActivityResult
  } finally {
    await page.close()
  }
}
