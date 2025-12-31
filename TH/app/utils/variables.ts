import type { CheckboxGroupItem } from "@nuxt/ui"

export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1968 + 1 }, (_, i) => 1968 + i)

export const SORT_DIRECTIONS = [
  { label: "Ascending", value: "ASC" },
  { label: "Descending", value: "DESC" }
]

export const TOUR_OPTIONS = Object.entries(tourEnum)
  .map(([key, value]) => {
    if (!["Men", "Women"].includes(value)) {
      return { label: value, value: key }
    }
  })
  .filter(Boolean) as CheckboxGroupItem[]
