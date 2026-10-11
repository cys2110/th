import { chromium, Locator } from "playwright"

const getWeekRankings = async (container: Locator, matchType: "Singles" | "Doubles") => {
  const rankings: Array<RankingResult> = []

  const rankingRows = await container.locator(".player-ranking-history__table-inner").locator(".player-ranking-history__table-row").all()

  if (rankingRows.length) {
    for (const row of rankingRows) {
      const [date, rank] = (
        await Promise.all([
          row.locator(".player-ranking-history__table-value--left").innerText(),
          row.locator(".player-ranking-history__table-value--right").innerText()
        ])
      ).map(v => v.trim())

      const startDate = parseDate(date!)

      rankings.push({
        start_date: startDate,
        rank: Number(rank),
        match_type: matchType
      })
    }
  }

  return rankings
}

export async function scrapeWtaRankings(id: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const page = await browser.newPage()

    await page.goto(`https://www.wtatennis.com/players/${id}/x/stats#main-content`, { waitUntil: "domcontentloaded" })

    await acceptWtaCookies(page)

    const weeklyTabContainer = page.locator('[data-ui-tab="Week by Week"]')

    const singlesContainer = weeklyTabContainer.locator('[data-ui-tab-week="Singles"]')
    const doublesContainer = weeklyTabContainer.locator('[data-ui-tab-week="Doubles"]')

    const rankings = await Promise.all([
      getWeekRankings(singlesContainer, "Singles"),
      getWeekRankings(doublesContainer, "Doubles")
    ])

    return rankings.flat()
  } finally {
    await browser.close()
  }
}
