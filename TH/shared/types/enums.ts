import { string, union, z } from "zod"

export const CurrencyEnum = z.enum(["USD", "EUR", "GBP", "AUD", "FRF"], "Please select a valid currency")

export type CurrencyEnumType = z.infer<typeof CurrencyEnum>

export const currencyEnum: Record<CurrencyEnumType, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  FRF: "\u20A3"
}

export const DrawEnum = z.enum(["Main", "Qualifying"], "Please select a valid draw type")

export type DrawEnumType = z.infer<typeof DrawEnum>

export const EnvironmentEnum = z.enum(["Indoor", "Outdoor"], "Please select a valid environment")

export type EnvironmentEnumType = z.infer<typeof EnvironmentEnum>

export const IncompleteEnum = z.enum(["B", "Def", "R", "WO"])

export type IncompleteEnumType = z.infer<typeof IncompleteEnum>

export const incompleteEnum: Record<IncompleteEnumType, string> = {
  B: "Bye",
  Def: "Defaulted",
  R: "Retired",
  WO: "Walkover"
}

export const LevelEnum = z.enum(["Tour", "Challenger", "ITF"], "Please select a valid level")

export type LevelEnumType = z.infer<typeof LevelEnum>

export const MatchTypeEnum = z.enum(["Singles", "Doubles"], "Please select a valid match type")

export type MatchTypeEnumType = z.infer<typeof MatchTypeEnum>

export const RoundEnum = z.enum([
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
  "Participation",
  "Alternate",
  "Day 1",
  "Day 2",
  "Day 3"
])

export type RoundEnumType = z.infer<typeof RoundEnum>

export const StatusEnum = z.enum(["AL", "CO", "JR", "LL", "NG", "Q", "PR", "SE", "WC"])

export type StatusEnumType = z.infer<typeof StatusEnum>

export const statusEnum: Record<StatusEnumType, string> = {
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

export const SurfaceEnum = z.enum(["Clay", "Grass", "Hard", "Carpet"], "Please select a valid surface")

export type SurfaceEnumType = z.infer<typeof SurfaceEnum>

export const tourEnum = {
  ATP: "ATP",
  WTA: "WTA",
  Men: "ITF-M",
  Women: "ITF-W",
  "ITF-M": "Men",
  "ITF-W": "Women"
} as const

export const TourInputEnum = z.enum(["ATP", "WTA", "Men", "Women"], "Please select a valid tour")
export type TourInputEnumType = z.infer<typeof TourInputEnum>

export const tourEnumTransform = union([TourInputEnum, string()]).transform(val => tourEnum[val as keyof typeof tourEnum])
