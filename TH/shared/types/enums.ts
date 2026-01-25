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
