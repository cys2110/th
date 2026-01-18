import { string } from "zod"

export const tourMapping = {
  ATP: "ATP",
  WTA: "WTA",
  Men: "ITF-M",
  Women: "ITF-W",
  "ITF-M": "Men",
  "ITF-W": "Women"
} as const

export const tourEnum = string()
  .refine(val => Object.keys(tourMapping).includes(val), {
    error: `Tour must be one of: ${Object.keys(tourMapping).join(", ")}`
  })
  .transform(val => tourMapping[val as keyof typeof tourMapping])
