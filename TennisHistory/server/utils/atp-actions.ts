import { Page } from "playwright"

export async function acceptCookies(page: Page) {
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
