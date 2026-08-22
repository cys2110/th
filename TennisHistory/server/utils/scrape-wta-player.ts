import { chromium } from "playwright"

const evaluateScript = (script: string | null) => {
  if (script) {
    const json = JSON.parse(script)

    const { givenName, familyName, nationality, birthDate, birthPlace, image, additionalProperty } = json

    return {
      first_name: givenName,
      last_name: familyName,
      country: nationality?.name,
      dob: birthDate,
      birth_place: birthPlace.address.addressLocality !== "N/A" ? birthPlace.address.addressLocality : null,
      birthCountry: birthPlace.address.addressCountry || null,
      rh: additionalProperty.find((p: any) => p.name === "Plays")?.value,
      image
    }
  }

  return null
}

const evaluateState = (string: string | null) => {
  if (string) {
    const { ytd, career } = JSON.parse(string)
    return {
      pm: career.prizeMoney ? Number(career.prizeMoney) : 0,
      current_singles: ytd.singles.rank ? Number(ytd.singles.rank) : null,
      current_doubles: ytd.doubles.rank ? Number(ytd.doubles.rank) : null,
      ch_singles: career.singles.rank ? Number(career.singles.rank) : null,
      ch_doubles: career.doubles.rank ? Number(career.doubles.rank) : null,
      ch_singles_date: ytd.singles.highRankDate ? parseDate(ytd.singles.highRankDate) : null,
      ch_doubles_date: ytd.doubles.highRankDate ? parseDate(ytd.doubles.highRankDate) : null
    }
  }

  return null
}

export async function scrapeWtaPlayer(id: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const page = await browser.newPage()

    await page.goto(`https://www.wtatennis.com/players/${id}/x`, { waitUntil: "domcontentloaded" })

    const scripts = await page.locator('script[type="application/ld+json"]').last().textContent()

    const response = evaluateScript(scripts)

    const playerStats = await page.locator(".profile-header").getAttribute("data-player-stats")

    const stats = evaluateState(playerStats)

    return {
      ...response,
      ...stats,
      tour: "WTA"
    }
  } finally {
    await browser.close()
  }
}
