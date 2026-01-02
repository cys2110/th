import type { CheckboxGroupItem } from "@nuxt/ui"

export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1968 + 1 }, (_, i) => 1968 + i)

export const CATEGORY_OPTIONS = [
  "ATP 250",
  "ATP 500",
  "ATP Challenger 100",
  "ATP Challenger 125",
  "ATP Challenger 175",
  "ATP Challenger 50",
  "ATP Challenger 75",
  "ATP Masters 1000",
  "Finals",
  "Grand Slam",
  "Laver Cup",
  "WTA 1000",
  "WTA 125",
  "WTA 250",
  "WTA 500"
]

export const FLASK_ROUTE = "http://127.0.0.1:5001"

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
