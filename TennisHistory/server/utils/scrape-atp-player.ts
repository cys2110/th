import { chromium } from "playwright"

export async function scrapeAtpPlayer(id: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const page = await browser.newPage()

    await page.goto(`https://www.atptour.com/en/players/x/${id}/overview`, { waitUntil: "domcontentloaded" })

    await acceptAtpCookies(page)

    const image = await page.locator(".player_shot").getByRole("img").getAttribute("src")

    const personalDetailsFields = ["Age", "DOB", "Height", "Turned pro", "Country", "Birthplace", "Plays", "Coach"] as const

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

    const currentSingles = singlesStatsDetails[0]
    const careerSingles = singlesStatsDetails[1]

    let currentSinglesRank = null
    let chSinglesRank = null
    let chSinglesDate = null
    let currentDoublesRank = null
    let chDoublesRank = null
    let chDoublesDate = null
    let pm = null

    if (currentSingles) {
      const currentSinglesStat = currentSingles.locator(".stat")

      currentSinglesRank = (await currentSinglesStat.count()) > 0 ? parseRank(await getParentText(currentSinglesStat)) : null
    }

    if (careerSingles) {
      const chSingles = careerSingles.locator(".stat")
      const prizeMoney = careerSingles.locator(".prize_money")

      if ((await chSingles.count()) > 0) {
        const date = chSingles.locator("span")

        chSinglesRank = parseRank(await getParentText(chSingles))
        chSinglesDate = (await date.count()) > 0 ? await date.innerText() : null
      }

      pm = (await prizeMoney.count()) > 0 ? await getParentText(prizeMoney) : null
    }

    await page.locator(".atp_player-profile-header-wrapper").getByRole("link", { name: "Doubles" }).click()

    const doublesStatsDetails = await page.locator(".player-stats-details").all()

    const currentDoubles = doublesStatsDetails[0]
    const careerDoubles = doublesStatsDetails[1]

    if (currentDoubles) {
      const currentDoublesStat = currentDoubles.locator(".stat")

      currentDoublesRank = (await currentDoublesStat.count()) > 0 ? parseRank(await getParentText(currentDoublesStat)) : null
    }

    if (careerDoubles) {
      const chDoubles = careerDoubles.locator(".stat")

      if ((await chDoubles.count()) > 0) {
        const date = chDoubles.locator("span")

        chDoublesRank = parseRank(await getParentText(chDoubles))
        chDoublesDate = (await date.count()) > 0 ? await date.innerText() : null
      }
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
      image: image ? `	https://www.atptour.com${image}` : null,
      dob: personalDetails["Age"] || personalDetails["DOB"] ? parseDate(personalDetails["Age"] || personalDetails["DOB"]!) : null,
      country: personalDetails["Country"],
      birth_place: birthPlace,
      birthCountry,
      height: personalDetails["Height"] ? parseHeight(personalDetails["Height"]) : null,
      rh: plays && plays !== "Unknown" ? plays.replace("-Handed", "") : null,
      bh: bh && bh !== "Unknown Backhand" ? bh.replace("-Handed Backhand", "") : null,
      turned_pro: personalDetails["Turned pro"],
      coaches: personalDetails["Coach"] ? parseCoaches(personalDetails["Coach"]) : null,
      current_singles: currentSinglesRank,
      ch_singles: chSinglesRank,
      ch_singles_date: chSinglesDate ? parseDate(chSinglesDate) : null,
      current_doubles: currentDoublesRank,
      ch_doubles: chDoublesRank,
      ch_doubles_date: chDoublesDate ? parseDate(chDoublesDate) : null,
      pm: pm ? parseCurrency(pm) : null,
      tour: "ATP"
    }
  } finally {
    await browser.close()
  }
}
