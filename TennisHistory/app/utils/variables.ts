export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)

export const CATEGORIES = [
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
  "WTA 500",
  "United Cup"
] as const

export const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"] as const

export const COUNTRY_DRAWS = ["8888", "615", "9900"]

export const CURRENCIES = ["AUD", "EUR", "FRF", "GBP", "USD"] as const

export const CURRENCY_MAPPING: Record<CurrencyType, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  FRF: "\u20A3"
} as const

export const CURRENCY_OPTIONS = Object.entries(CURRENCY_MAPPING).map(([key, value]) => ({ label: value, value: key }))

export const DRAWS = [
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
] as const

export const DRAW_TYPES = ["Main", "Qualifying"] as const

export const INCOMPLETE_OPTIONS = ["B", "D", "R", "WO"] as const

export const INCOMPLETE_MAPPING: Record<IncompleteType, string> = {
  B: "Bye",
  D: "Defaulted",
  R: "Retired",
  WO: "Walkover"
}

export const LEVELS = ["Tour", "Challenger", "ITF"] as const

export const OPEN_ERA_YEARS = Array.from({ length: new Date().getFullYear() - 1968 + 1 }, (_, i) => 1968 + i)

export const FLASK_ROUTE = "http://127.0.0.1:5001"

export const MATCH_TYPES = ["Singles", "Doubles"] as const

export const ROUNDS = [
  "Win",
  "Final",
  "Semifinals",
  "Quarterfinals",
  "Round of 16",
  "Round of 32",
  "Round of 64",
  "Round of 128",
  "Qualifier",
  "Qualifying round 3",
  "Qualifying round 2",
  "Qualifying round 1",
  "Round robin",
  "Group stage",
  "Participation",
  "Alternate",
  "Day 1",
  "Day 2",
  "Day 3",
  "Bronze Medal Match",
  "3rd Place Match"
] as const

export const ROUND_ABBREVIATION_MAPPING: Record<RoundType, string> = {
  "Day 1": "D1",
  "Day 2": "D2",
  "Day 3": "D3",
  Participation: "P",
  Alternate: "A",
  "Group stage": "G",
  "Round robin": "RR",
  "Qualifying round 1": "Q1",
  "Qualifying round 2": "Q2",
  "Qualifying round 3": "Q3",
  Qualifier: "Q",
  "Round of 128": "R128",
  "Round of 64": "R64",
  "Round of 32": "R32",
  "Round of 16": "R16",
  Quarterfinals: "QF",
  Semifinals: "SF",
  Final: "F",
  Win: "W",
  "Bronze Medal Match": "Bronze",
  "3rd Place Match": "3P"
}

export const ROUND_NUMBER_MAPPING: Record<RoundType, number> = {
  "Round robin": 4,
  "Group stage": 4,
  Participation: 5,
  Alternate: 6,
  "Day 1": 3,
  "Day 2": 2,
  "Day 3": 1,
  "Qualifying round 1": 11,
  "Qualifying round 2": 11,
  "Qualifying round 3": 10,
  Qualifier: 9,
  "Round of 128": 8,
  "Round of 64": 7,
  "Round of 32": 6,
  "Round of 16": 4,
  Quarterfinals: 3,
  Semifinals: 2,
  Final: 1,
  Win: 0,
  "Bronze Medal Match": 1,
  "3rd Place Match": 1
}

export const STATUSES = ["AL", "CO", "JR", "LL", "NG", "Q", "PR", "SE", "WC"] as const

export const STATUS_MAPPING: Record<StatusType, string> = {
  AL: "Alternate",
  CO: "Collegian",
  JR: "Junior Reserved",
  LL: "Lucky Loser",
  NG: "Next Gen",
  Q: "Qualifier",
  PR: "Protected Ranking",
  SE: "Special Exempt",
  WC: "Wild Card"
}

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
