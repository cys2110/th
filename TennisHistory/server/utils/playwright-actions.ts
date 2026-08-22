import type { Locator } from "playwright"

export function getParentText(locator: Locator) {
  return locator.evaluate(el =>
    [...el.childNodes]
      .filter(node => node.nodeType === 3)
      .map(node => node.textContent)
      .join("")
      .trim()
  )
}
