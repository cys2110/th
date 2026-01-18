import { object, string, union, z } from "zod"
import { Integer, Date as NeoDate } from "neo4j-driver"

export const intToNumberSchema = z.instanceof(Integer, { error: "Invalid neo4j Integer object" }).transform(val => val.toInt())

export const neoDateToStringSchema = z
  .instanceof(NeoDate, { error: "Invalid neo4j Date object" })
  .transform(val => val.toStandardDate().toISOString().slice(0, 10))

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
