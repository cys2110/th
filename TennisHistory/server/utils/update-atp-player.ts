import { chromium } from "playwright"

export async function updateAtpPlayer(id: string) {
  const browser = await chromium.launch({ headless: false })

  // dob, nationality_id, birth_place, birth_country_id, bh, height, pm, rh, turned_pro

  const personalDetailsFields = ["Age", "DOB", "Height", "Turned pro", "Country", "Birthplace", "Plays"] as const

  try {
    const page = await browser.newPage()

    await page.goto(`https://www.atptour.com/en/players/x/${id}/overview`, { waitUntil: "domcontentloaded" })

    // await page.pause()

    await acceptAtpCookies(page)

    return {
      success: true
    }
  } finally {
    await browser.close()
  }
}
