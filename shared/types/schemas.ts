// shared/types/schemas.ts
import { array, literal, number, object, string, z } from "zod"
import { Integer, Date as NeoDate, Duration } from "neo4j-driver"

export const TourEnum = z.enum(["ATP", "WTA", "Men", "Women"], "Please select a valid tour")
export type TourEnumType = z.infer<typeof TourEnum>

export const tourEnum = {
  ATP: "ATP",
  WTA: "WTA",
  Men: "ITF-M",
  Women: "ITF-W",
  "ITF-M": "Men",
  "ITF-W": "Women"
} as const

export const EnvironmentEnum = z.enum(["Indoor", "Outdoor"], "Please select a valid environment")

export const SurfaceEnum = z.enum(["Clay", "Grass", "Hard", "Carpet"], "Please select a valid surface")

export const MatchTypeEnum = z.enum(["Singles", "Doubles"], "Please select a valid match type")
export type MatchTypeEnumType = z.infer<typeof MatchTypeEnum>

export const DrawEnum = z.enum(["Main", "Qualifying"], "Please select a valid draw type")
export type DrawEnumType = z.infer<typeof DrawEnum>

export const LevelEnum = z.enum(["Tour", "Challenger", "ITF"], "Please select a valid level")

export const CurrencyEnum = z.enum(["USD", "EUR", "GBP", "AUD", "FRF"], "Please select a valid currency")
export type CurrencyEnumType = z.infer<typeof CurrencyEnum>

export const currencyEnum: Record<CurrencyEnumType, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  FRF: "\u20A3"
}

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

export const roundEnum: Record<RoundEnumType, string> = {
  "Day 1": "D1",
  "Day 2": "D2",
  "Day 3": "D3",
  Participation: "P",
  Alternate: "A",
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
  Win: "W"
}

export const IncompleteEnum = z.enum(["B", "Def", "R", "WO"])
export type IncompleteEnumType = z.infer<typeof IncompleteEnum>

export const incompleteEnum: Record<IncompleteEnumType, string> = {
  B: "Bye",
  Def: "Defaulted",
  R: "Retired",
  WO: "Walkover"
}

export const yearSchema = number("Please enter a valid year").int("Please enter a valid year").positive("Please enter a valid year")

export const intToNumberSchema = z.instanceof(Integer).transform(val => val.toInt())

export const neoDateToStringSchema = z.instanceof(NeoDate).transform(val => val.toStandardDate().toISOString().slice(0, 10))

export const durationToStringSchema = z.instanceof(Duration).transform(val => {
  const allSeconds = (val.seconds as Integer).toInt()
  const hours = Math.floor(allSeconds / 3600)
  const minutes = Math.floor((allSeconds % 3600) / 60)
  const seconds = allSeconds % 60
  return `${hours > 0 ? String(hours).padStart(2, "0") + ":" : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
})

export const sortFieldSchema = array(
  object({
    field: string(),
    direction: literal(["ASC", "DESC"])
  })
)
export type SortFieldType = z.infer<typeof sortFieldSchema>

export const countrySchema = object({
  id: string(),
  name: string(),
  alpha2: string().optional(),
  continent: string()
})
export type CountryType = z.infer<typeof countrySchema>

export const surfaceSchema = object({
  id: string(),
  environment: EnvironmentEnum,
  surface: SurfaceEnum
})

export const venueSchema = object({
  id: string(),
  name: string().optional(),
  city: string(),
  country: countrySchema
})
export type VenueType = z.infer<typeof venueSchema>

export const personSchema = object({
  id: string(),
  first_name: string().nullish(),
  last_name: string().nullish(),
  country: countrySchema.nullish(),
  rank: intToNumberSchema.nullish(),
  labels: array(string()).optional(),
  years: string().optional()
})
export type PersonType = z.infer<typeof personSchema>
