import { Integer, Date as NeoDate } from "neo4j-driver"
import { array, boolean, literal, number, object, string, z } from "zod"

export const intToNumberSchema = z
  .instanceof(Integer, {
    error: issue => `Invalid neo4j Integer object at ${issue.path?.join(",")}: ${issue.input}.`
  })
  .transform(val => val.toInt())

export const neoDateToStringSchema = z
  .instanceof(NeoDate, {
    error: issue => `Invalid neo4j Date object at ${issue.path?.join(",")}: ${issue.input}.`
  })
  .transform(val => val.toStandardDate().toISOString().slice(0, 10))

export const yearSchema = number("Please enter a valid year.").int("Please enter a valid year.").positive("Please enter a valid year.")

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

export const countrySchema = object(
  {
    id: string("Country ID is required."),
    name: string("Country name is required."),
    alpha2: string().optional(),
    continent: string("Country continent is required."),
    start_date: neoDateToStringSchema.optional(),
    end_date: neoDateToStringSchema.optional()
  },
  {
    error: iss => {
      if (iss.code === "invalid_type") {
        return `Country must be an object. Received: ${iss.input}.`
      }
      return `${iss.code}: ${iss.input}.`
    }
  }
)

export type CountryType = z.infer<typeof countrySchema>

export const personSchema = object(
  {
    id: string("Person ID is required"),
    first_name: string("First name is required"),
    last_name: string("Last name is required"),
    country: countrySchema
  },
  {
    error: iss => {
      if (iss.code === "invalid_type") {
        return `Person must be an object. Received: ${iss.input}.`
      }
      return `${iss.code}: ${iss.input}.`
    }
  }
)

export type PersonType = z.infer<typeof personSchema>

export const coachSchema = personSchema
  .omit({
    country: true
  })
  .extend({
    labels: array(string()),
    years: string().optional()
  })

export type CoachType = z.infer<typeof coachSchema>

export const surfaceSchema = object({
  id: string("Surface ID is required."),
  environment: EnvironmentEnum,
  surface: SurfaceEnum
})

export type SurfaceType = z.infer<typeof surfaceSchema>

export const venueSchema = object({
  id: string("Venue ID is required."),
  name: string().optional(),
  city: string("City is required."),
  country: countrySchema
})

export type VenueType = z.infer<typeof venueSchema>

export const laverEntrySchema = object({
  id: string(),
  team: literal(["Europe", "World"]),
  points: intToNumberSchema
})
