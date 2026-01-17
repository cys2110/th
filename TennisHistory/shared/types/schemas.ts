import { any, array, boolean, literal, number, object, record, string, union, z } from "zod"
import { Integer, Date as NeoDate } from "neo4j-driver"
import { EnvironmentEnum, SurfaceEnum } from "./enums"

export const intToNumberSchema = z.instanceof(Integer).transform(val => val.toInt())

export const neoDateToStringSchema = z.instanceof(NeoDate).transform(val => val.toStandardDate().toISOString().slice(0, 10))

export const sortFieldSchema = object({
  field: string(),
  direction: literal(["ASC", "DESC"])
})

export type SortFieldType = z.infer<typeof sortFieldSchema>

export const groupedResultsSchema = object({
  id: string(),
  __group: boolean(),
  count: intToNumberSchema,
  has_children: boolean(),
  group_key: record(string(), union([string(), intToNumberSchema])),
  subRows: array(any())
})

export type GroupedResultsType = z.infer<typeof groupedResultsSchema>

export const countrySchema = object({
  id: string(),
  name: string(),
  alpha2: string().optional(),
  continent: string(),
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional()
})

export type CountryType = z.infer<typeof countrySchema>

export const personSchema = object({
  id: string(),
  first_name: string().optional(),
  last_name: string().optional(),
  country: countrySchema.optional()
})

export type PersonType = z.infer<typeof personSchema>

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

export const yearSchema = number("Please enter a valid year").int("Please enter a valid year").positive("Please enter a valid year")

export const coachSchema = personSchema
  .omit({
    country: true
  })
  .extend({
    years: string().optional(),
    labels: array(string())
  })

export type CoachType = z.infer<typeof coachSchema>
