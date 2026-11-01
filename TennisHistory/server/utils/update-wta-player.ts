import { chromium } from "playwright"

export async function updateWtaPlayer(id: string) {
  const browser = await chromium.launch({ headless: false })

  try {
    const page = await browser.newPage()

    return {
      success: true
    }
  } finally {
    await browser.close()
  }
}
