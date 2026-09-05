import { chromium, Locator, Page } from "playwright"

interface Ranking {
  start_date: string
  rank: number
  match_type: "Singles" | "Doubles"
}

const getWeekRankings = async (container: Locator, matchType: "Singles" | "Doubles") => {
  const rankings: Array<Ranking> = []

  const rankingRows = await container.locator(".player-ranking-history__table-inner").locator(".player-ranking-history__table-row").all()

  if (rankingRows.length) {
    for (const row of rankingRows) {
      const date = (await row.locator(".player-ranking-history__table-value--left").innerText()).trim()
      const rank = (await row.locator(".player-ranking-history__table-value--right").innerText()).trim()

      rankings.push({
        start_date: parseDate(date),
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

    return [...(await getWeekRankings(singlesContainer, "Singles")), ...(await getWeekRankings(doublesContainer, "Doubles"))]
  } finally {
    await browser.close()
  }
}
