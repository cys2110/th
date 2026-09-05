import { chromium } from "playwright"

export async function scrapeAtpRankings(id: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const page = await browser.newPage()

    await page.goto(`https://www.atptour.com/en/players/x/${id}/rankings-history?year=all`, { waitUntil: "domcontentloaded" })

    await acceptAtpCookies(page)

    const rankings: Array<{ start_date: string; rank: number; match_type: "Singles" | "Doubles" }> = []

    const matchTypeContainers = await page.locator(".rankings-list").all()

    for (let i = 0; i < 2; i++) {
      const matchType = i === 0 ? "Singles" : "Doubles"

      const rankingItems = await matchTypeContainers[i]?.locator(".ranking-item").all()

      if (rankingItems) {
        for (const item of rankingItems) {
          const date = await item.locator(".name").innerText()
          const rank = await item.locator(".set-points").innerText()

          rankings.push({ start_date: date.replaceAll("/", "-"), rank: Number(rank), match_type: matchType })
        }
      }
    }

    return rankings
  } finally {
    await browser.close()
  }
}
