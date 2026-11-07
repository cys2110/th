import { chromium } from "playwright"

export async function updateAtpPlayer(id: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const page = await browser.newPage()

    await page.goto(`https://www.atptour.com/en/players/x/${id}/overview`, { waitUntil: "domcontentloaded" })

    await acceptAtpCookies(page)

    const personalDetailsFields = ["Age", "DOB", "Height", "Turned pro", "Country", "Birthplace", "Plays"] as const

    const personalDetails = Object.fromEntries(
      await Promise.all(
        personalDetailsFields.map(async field => {
          const value = page.getByText(field, { exact: true }).locator("+ span")

          return [field, (await value.count()) > 0 ? await value.innerText() : null] as const
        })
      )
    ) as Record<(typeof personalDetailsFields)[number], string | null>

    await page.locator(".atp_player-profile-header-wrapper").getByRole("link", { name: "Singles" }).click()

    const singlesStatsDetails = await page.locator(".player-stats-details").all()

    const careerSingles = singlesStatsDetails[1]

    let pm = null

    if (careerSingles) {
      const prizeMoney = careerSingles.locator(".prize_money")

      pm = (await prizeMoney.count()) > 0 ? await getParentText(prizeMoney) : null
    }

    let birthPlace
    let birthCountry

    if (personalDetails["Birthplace"]) {
      const [place, country] = personalDetails["Birthplace"].split(", ")

      birthPlace = place
      birthCountry = country
    }

    const [plays, bh] = personalDetails["Plays"]?.split(", ") ?? []

    return {
      dob: personalDetails["Age"] || personalDetails["DOB"] ? parseDate(personalDetails["Age"] || personalDetails["DOB"]!) : null,
      country: personalDetails["Country"],
      birth_place: birthPlace,
      birthCountry,
      height: personalDetails["Height"] ? parseHeight(personalDetails["Height"]) : null,
      rh: plays && plays !== "Unknown" ? plays.replace("-Handed", "") : null,
      bh: bh && bh !== "Unknown Backhand" ? bh.replace("-Handed Backhand", "") : null,
      turned_pro: personalDetails["Turned pro"],
      pm: pm ? parseCurrency(pm) : null
    }
  } finally {
    await browser.close()
  }
}
