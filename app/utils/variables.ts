import type { CheckboxGroupItem } from "@nuxt/ui"

export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1968 + 1 }, (_, i) => 1968 + i)

export const COUNTRY_DRAWS = ["8888", "615", "9900"]

export const CURRENCY_OPTIONS = Object.entries(currencyEnum).map(([key, value]) => ({
  label: value,
  value: key
}))

export const DRAW_OPTIONS = [
  "Round of 128",
  "Round of 64",
  "Round of 48",
  "Round of 32",
  "Round of 28",
  "Round of 24",
  "Round of 16",
  "Round of 8",
  "Round of 4",
  "Round robin",
  "Country draw",
  "Laver Cup"
]

export const EVENT_PAGES = [
  { label: "Overview", name: "event", icon: ICONS.overview },
  { label: "Results", name: "results", icon: ICONS.cards },
  { label: "Draws", name: "draws", icon: ICONS.draw, ui: { leadingIcon: "rotate-270" } }
]

export const FLASK_ROUTE = "http://127.0.0.1:5001"

export const LEVEL_OPTIONS = ["Tour", "Challenger", "ITF"]

export const PLAYER_PAGES = [
  { label: "Overview", name: "player", icon: ICONS.profile },
  { label: "Activity", name: "activity", icon: ICONS.event },
  { label: "Titles and Finals", name: "titles-and-finals", icon: ICONS.one },
  { label: "Win-Loss Index", name: "wl-index", icon: ICONS.barChart },
  { label: "Stats", name: "stats", icon: ICONS.stats },
  { label: "Record", name: "record", icon: ICONS.tournament }
]

export const ROUND_OPTIONS = Object.keys(roundEnum).filter(round => !["Win", "Qualifier"].includes(round))

export const SORT_DIRECTIONS = [
  { label: "Ascending", value: "ASC" },
  { label: "Descending", value: "DESC" }
]

export const SURFACE_OPTIONS = ["Indoor Clay", "Outdoor Clay", "Outdoor Grass", "Indoor Hard", "Outdoor Hard", "Indoor Carpet", "Outdoor Carpet"]

export const TOUR_OPTIONS = Object.entries(tourEnum)
  .map(([key, value]) => {
    if (!["Men", "Women"].includes(value)) {
      return { label: value, value: key }
    }
  })
  .filter(Boolean) as CheckboxGroupItem[]
