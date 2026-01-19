import { object, string, z } from "zod"
import { Integer, Date as NeoDate } from "neo4j-driver"

export const intToNumberSchema = z
  .instanceof(Integer, {
    error: issue => `Invalid neo4j Integer object at ${issue.path?.join(",")}: ${issue.input}.`
  })
  .transform(val => val.toInt())

export const countrySchema = object(
  {
    id: string("Country ID is required."),
    name: string("Country name is required."),
    alpha2: string().optional(),
    continent: string("Country continent is required.")
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
