import type { Browser } from "playwright"

const parseTournamentFooter = (footer: string, playerId: string): ActivityResult | null => {
  const values = footer.match(/Points:\s*([\d,]+).*?ATP Ranking:\s*([\d,]+).*?Prize Money:\s*\p{Sc}?\s*([\d,]+(?:\.\d+)?)/iu)

  if (!values?.[1] || !values[2] || !values[3]) return null

  return {
    player_id: playerId,
    points: Number(values[1].replaceAll(",", "")),
    rank: Number(values[2].replaceAll(",", "")),
    pm: Number(values[3].replaceAll(",", ""))
  }
}

export async function scrapeAtpActivity(browser: Browser, playerId: string, matchType: MatchTypeEnum, tournamentId: string, year: string) {
  const page = await browser.newPage()

  try {
    await page.goto(`https://www.atptour.com/en/players/x/${playerId}/player-activity?year=${year}&matchType=${matchType}`, {
      waitUntil: "domcontentloaded"
    })

    await page.pause()

    await acceptAtpCookies(page)

    const tournamentContainers = await page.locator(".tournament").all()

    for (const container of tournamentContainers) {
      const linkWrapper = container.locator(".schedule").locator("a")

      if ((await linkWrapper.count()) === 0) continue

      const link = await linkWrapper.getAttribute("href")

      if (!link) continue

      const tournamentPath = new URL(link, page.url()).pathname.split("/").filter(Boolean)

      if (!tournamentPath.includes(tournamentId)) continue

      const tournamentFooter = container.locator("+ .tournament-footer")

      if ((await tournamentFooter.count()) === 0) {
        throw new Error(`Tournament footer not found for tournament ${tournamentId}`)
      }

      const activity = parseTournamentFooter(await tournamentFooter.innerText(), playerId)

      if (!activity) {
        throw new Error(`Unable to parse tournament footer for tournament ${tournamentId}`)
      }

      return activity as ActivityResult
    }

    throw new Error(`Tournament ${tournamentId} not found on ${matchType.toLowerCase()} activity page`)
  } finally {
    await page.close()
  }
}
