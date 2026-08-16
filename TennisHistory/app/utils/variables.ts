// Image
export const MAX_FILE_SIZE = 7 * 1024 * 1024 // 7MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]

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
  "Next Gen Finals",
  "Grand Slam",
  "Laver Cup",
  "WTA 1000",
  "WTA 125",
  "WTA 250",
  "WTA 500",
  "United Cup",
  "ATP Cup",
  "ATP World Tour Masters 1000",
  "ATP World Tour 500",
  "ATP World Tour 250",
  "ATP Masters Series",
  "ATP International Series Gold",
  "ATP International Series",
  "WTA Premier 5",
  "WTA Premier Mandatory",
  "WTA International",
  "Tennis Masters Series",
  "ATP Championship Series",
  "ATP World Series",
  "ATP Super 9",
  "ATP Championship Series, Single Week",
  "World Championship Tennis",
  "Grand Prix - Super Series",
  "ATP Challenger 90",
  "ATP Challenger 80",
  "WTA 125K Series",
  "M25",
  "W60"
]

export const CURRENCY_MAPPING = {
  AUD: "A$",
  EUR: "€",
  FRF: "\u20A3",
  GBP: "£",
  USD: "$"
}
export const CURRENCIES = Object.entries(CURRENCY_MAPPING).map(([key, value]) => ({ label: value, value: key }))

export const SURFACES = [
  "Outdoor Clay",
  "Outdoor Grass",
  "Outdoor Hard",
  "Indoor Hard",
  "Indoor Clay",
  "Indoor Grass",
  "Indoor Carpet",
  "Outdoor Carpet"
]
