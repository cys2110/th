import { array, boolean, literal, number, object, string, union, z } from "zod"
import { Integer, Date as NeoDate } from "neo4j-driver"

export const intToNumberSchema = z.instanceof(Integer, { error: "Invalid neo4j Integer object" }).transform(val => val.toInt())

export const neoDateToStringSchema = z
  .instanceof(NeoDate, { error: "Invalid neo4j Date object" })
  .transform(val => val.toStandardDate().toISOString().slice(0, 10))

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
  id: string("Country ID is required."),
  name: string("Country name is required."),
  alpha2: string().optional(),
  continent: string("Country continent is required."),
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional()
})

export type CountryType = z.infer<typeof countrySchema>

export const personSchema = object({
  id: string("Person ID is required."),
  first_name: string().optional(),
  last_name: string().optional(),
  country: countrySchema.optional()
})

export type PersonType = z.infer<typeof personSchema>

export const coachSchema = personSchema
  .omit({
    country: true
  })
  .extend({
    years: string().optional(),
    labels: array(string())
  })

export type CoachType = z.infer<typeof coachSchema>
