import type { Page } from "playwright"

export const verifyHuman = async (page: Page) => {
  const checkbox = page.locator('input[type="checkbox"]')

  try {
    await checkbox.waitFor({
      state: "visible",
      timeout: 3000
    })

    await checkbox.click()
  } catch {
    console.log("Human verification did not appear")
  }
}

export async function acceptAtpCookies(page: Page) {
  const cookieButton = page.getByRole("button", { name: "Essential Cookies Only" })

  try {
    await cookieButton.waitFor({
      state: "visible",
      timeout: 3000
    })

    await cookieButton.click()
  } catch {
    console.log("Cookie banner did not appear")
  }
}

export const parsePlayerLink = (link: string) => {
  const match = link.match(/\/en\/players\/[^/"']+\/([a-z0-9]{4})\/overview/i)

  return match?.[1] ?? null
}
