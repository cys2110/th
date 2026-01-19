import { boolean, number, object, string, z } from "zod"
import { EnvironmentEnum, SurfaceEnum } from "./enums"

export const yearSchema = number("Please enter a valid year.").int("Please enter a valid year.").positive("Please enter a valid year.")

export const countrySchema = object({
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional()
})

export type CountryType = z.infer<typeof countrySchema>

export const surfaceSchema = object({
  id: string(),
  environment: EnvironmentEnum,
  surface: SurfaceEnum
})

export type SurfaceType = z.infer<typeof surfaceSchema>

export const venueSchema = object({
  id: string(),
  name: string().optional(),
  city: string(),
  country: countrySchema
})

export type VenueType = z.infer<typeof venueSchema>
