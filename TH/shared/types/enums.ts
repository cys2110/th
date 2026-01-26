import { string, z } from "zod"

export const ContinentEnum = z.enum(["Africa", "Asia", "Europe", "North America", "Oceania", "South America"], {
  error: iss => {
    if (iss.code === "invalid_value") {
      return `Continent must be one of: Africa, Asia, Europe, North America, Oceania, South America. Received: ${iss.input}.`
    } else {
      return `${iss.code}: ${iss.input}.`
    }
  }
})

export type ContinentEnumType = z.infer<typeof ContinentEnum>

export const CurrencyEnum = z.enum(["USD", "EUR", "GBP", "AUD", "FRF"], "Please select a valid currency")

export type CurrencyEnumType = z.infer<typeof CurrencyEnum>

export const currencyEnum: Record<CurrencyEnumType, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  FRF: "\u20A3"
}

export const EnvironmentEnum = z.enum(["Indoor", "Outdoor"], "Please select a valid environment")

export type EnvironmentEnumType = z.infer<typeof EnvironmentEnum>

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
  "Group stage",
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
  Win: "W"
}

export const tourMapping = {
  ATP: "ATP",
  WTA: "WTA",
  Men: "ITF-M",
  Women: "ITF-W",
  "ITF-M": "Men",
  "ITF-W": "Women"
} as const

export const TourKey = z.enum(tourMapping)

export type TourKeyType = z.infer<typeof TourKey>

export const TourEnum = string()
  .refine(val => Object.keys(tourMapping).includes(val), {
    error: `Tour must be one of: ${Object.keys(tourMapping).join(", ")}`
  })
  .transform(val => tourMapping[val as keyof typeof tourMapping])

export type TourEnumType = z.infer<typeof TourEnum>

export const SurfaceEnum = z.enum(["Clay", "Grass", "Hard", "Carpet"], "Please select a valid surface")

export type SurfaceEnumType = z.infer<typeof SurfaceEnum>
