import { array, boolean, literal, number, object, string, z } from "zod"
import { EnvironmentEnum, SurfaceEnum } from "./enums"

export const sortFieldSchema = object({
  field: string("Sort field is required."),
  direction: literal(["ASC", "DESC"], { error: "Sort direction must be either 'ASC' or 'DESC'" })
})

export type SortFieldType = z.infer<typeof sortFieldSchema>

export const groupedResultsSchema = object({
  id: string("Group ID is required."),
  __group: boolean("Group flag is required."),
  count: intToNumberSchema,
  has_children: boolean("Has children flag is required.")
})

export const yearSchema = number("Please enter a valid year.").int("Please enter a valid year.").positive("Please enter a valid year.")

export const countrySchema = object({
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional()
})

export type CountryType = z.infer<typeof countrySchema>

export const coachSchema = personSchema
  .omit({
    country: true
  })
  .extend({
    years: string().optional(),
    labels: array(string())
  })

export type CoachType = z.infer<typeof coachSchema>

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
