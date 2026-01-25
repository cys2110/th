import { object, string, z } from "zod"
import { Integer, Date as NeoDate } from "neo4j-driver"

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
