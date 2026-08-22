export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)

export const INCOMPLETE_OPTIONS = ["B", "D", "R", "WO"] as const

export const INCOMPLETE_MAPPING: Record<IncompleteType, string> = {
  B: "Bye",
  D: "Defaulted",
  R: "Retired",
  WO: "Walkover"
}

export const OPEN_ERA_YEARS = Array.from({ length: new Date().getFullYear() - 1968 + 1 }, (_, i) => 1968 + i)

export const FLASK_ROUTE = "http://127.0.0.1:5001"

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

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
