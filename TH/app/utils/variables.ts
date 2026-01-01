import type { CheckboxGroupItem } from "@nuxt/ui"

/** @constant ALL_YEARS - Array of all years from 1968 to the current year */
export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1968 + 1 }, (_, i) => 1968 + i)

/** @constant FLASK_ROUTE - URL for Flask server */
export const FLASK_ROUTE = "http://127.0.0.1:5001"

/** @constant SORT_DIRECTIONS - Array of sort direction options */
export const SORT_DIRECTIONS = [
  { label: "Ascending", value: "ASC" },
  { label: "Descending", value: "DESC" }
]

/** @constant TOUR_OPTIONS - Array of tour options */
export const TOUR_OPTIONS = Object.entries(tourEnum)
  .map(([key, value]) => {
    if (!["Men", "Women"].includes(value)) {
      return { label: value, value: key }
    }
  })
  .filter(Boolean) as CheckboxGroupItem[]
