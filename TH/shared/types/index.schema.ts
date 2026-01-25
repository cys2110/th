import { array, boolean, literal, number, object, string, z } from "zod"
import { Integer, Date as NeoDate } from "neo4j-driver"

export const yearSchema = number("Please enter a valid year.").int("Please enter a valid year.").positive("Please enter a valid year.")

export const intToNumberSchema = z
  .instanceof(Integer, {
    error: issue => `Invalid neo4j Integer object at ${issue.path?.join(",")}: ${issue.input}.`
  })
  .transform(val => val.toInt())

export const neoDateToStringSchema = z
  .instanceof(NeoDate, {
    error: issue => `Invalid neo4j Date object at ${issue.path?.join(".")}: ${issue.input}.`
  })
  .transform(val => val.toStandardDate().toISOString().slice(0, 10))

export const sortFieldSchema = object({
  field: string("Sort field is required."),
  direction: literal(["ASC", "DESC"], { error: "Sort direction must be either 'ASC' or 'DESC'" })
})

export type SortFieldType = z.infer<typeof sortFieldSchema>

export const groupedResultsSchema = object({
  id: string("Group ID is required"),
  __group: boolean("Group flag is required"),
  count: intToNumberSchema,
  has_children: boolean("Has children flag is required")
})

export const countrySchema = object(
  {
    id: string("ID is required").toUpperCase(),
    name: string("Name is required"),
    alpha2: string()
      .toLowerCase()
      .refine(val => val.length === 2, "Alpha-2 code must be 2 characters")
      .optional(),
    continent: ContinentEnum
  },
  {
    error: iss => {
      if (iss.code === "invalid_type") {
        return `Country must be an object. Received: ${iss.input}.`
      } else if (iss.code === "unrecognized_keys") {
        return `Country has unrecognized keys: ${Object.keys(iss.keys).join(", ")}.`
      }
    }
  }
)

export type CountryType = z.infer<typeof countrySchema>

export const personSchema = object(
  {
    id: string("ID is required"),
    first_name: string("First name is required"),
    last_name: string("Last name is required"),
    country: countrySchema
  },
  {
    error: iss => {
      if (iss.code === "invalid_type") {
        return `Person must be an object. Received: ${iss.input}.`
      } else if (iss.code === "unrecognized_keys") {
        return `Person has unrecognized keys: ${Object.keys(iss.keys).join(", ")}.`
      }
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
