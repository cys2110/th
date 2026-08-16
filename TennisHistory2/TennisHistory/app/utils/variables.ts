export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)

export const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"] as const

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

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

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
