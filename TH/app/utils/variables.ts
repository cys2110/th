export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1850 + 1 }, (_, i) => 1850 + i)

export const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"] as const

export const CURRENCIES = ["AUD", "EUR", "FRF", "GBP", "USD"] as const

export const CURRENCY_MAPPING: Record<string, string> = {
  AUD: "A$",
  EUR: "€",
  FRF: "\u20A3",
  GBP: "£",
  USD: "$"
}

export const CURRENCY_OPTIONS = Object.entries(CURRENCY_MAPPING).map(([key, value]) => ({ label: value, value: key }))

export const DRAWS = [
  "Round of 128",
  "Round of 96",
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
] as const

export const FLASK_ROUTE = "http://127.0.0.1:5001"

export const LEVELS = ["Tour", "Challenger", "ITF"] as const

export const OPEN_ERA_YEARS = Array.from({ length: new Date().getFullYear() - 1968 + 1 }, (_, i) => 1968 + i)

export const SURFACE_OPTIONS = [
  { id: "3a563ec6-7e00-48e2-88c0-b867f42f3ba5", label: "Indoor Clay" },
  { id: "18ab5b08-545c-476e-8ed8-ad6741538ab2", label: "Outdoor Clay" },
  { id: "553624bf-4ff9-48cb-adfd-474d7abc5d8a", label: "Indoor Grass" },
  { id: "09a065ee-96c7-4d1a-8e66-1c691f085380", label: "Outdoor Grass" },
  { id: "8507f090-8af0-4882-bad3-8cd0ef9876f8", label: "Indoor Hard" },
  { id: "f1d82ff0-768e-474a-aeab-a9672eb9e8c5", label: "Outdoor Hard" },
  { id: "fe0bb727-2c44-4859-925b-a17ea9f85172", label: "Indoor Carpet" },
  { id: "9305e339-596b-4264-955b-ad412c984fa3", label: "Outdoor Carpet" }
]

export const TOUR_OPTIONS = ["ATP", "WTA", "ITF-M", "ITF-W"] as const
