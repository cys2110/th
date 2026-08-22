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
]

export const ROUND_ABBREVIATION_MAPPING: Record<string, string> = {
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

export const ROUND_NUMBER_MAPPING: Record<string, number> = {
  "Round robin": 4,
  "Group stage": 4,
  Participation: 5,
  Alternate: 6,
  "Day 1": 3,
  "Day 2": 2,
  "Day 3": 1,
  "Qualifying round 1": 11,
  "Qualifying round 2": 10,
  "Qualifying round 3": 9,
  Qualifier: 8,
  "Round of 128": 7,
  "Round of 64": 6,
  "Round of 32": 5,
  "Round of 16": 4,
  Quarterfinals: 3,
  Semifinals: 2,
  Final: 1,
  Win: 0,
  "Bronze Medal Match": 1,
  "3rd Place Match": 1
}

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
