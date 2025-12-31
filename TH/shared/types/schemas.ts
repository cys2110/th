/**
 * @module shared/types/schemas
 * @description Schemas shared across client and server side
 * @see module shared/types/enums
 */

import { array, literal, object, string, z } from "zod"
import { Integer, Date as NeoDate } from "neo4j-driver"

/** @function intToNumberSchema - Transforms an Integer to a number */
export const intToNumberSchema = z.instanceof(Integer).transform(val => val.toInt())

/** @function neoDateToStringSchema - Transforms a Neo4j cypher Date to a string */
export const neoDateToStringSchema = z.instanceof(NeoDate).transform(val => val.toStandardDate().toISOString().slice(0, 10))

/** @interface SortFieldType - Represents the fields to be sorted on in API query */
export const sortFieldSchema = object({
  field: string(),
  direction: literal(["ASC", "DESC"])
})
export type SortFieldType = z.infer<typeof sortFieldSchema>

/** @interface CountryType - Represents a country with its basic details */
export const countrySchema = object({
  id: string(),
  name: string(),
  alpha2: string().optional(),
  continent: string()
})
export type CountryType = z.infer<typeof countrySchema>

/** @interface PersonType - Represents a person with basic identification details */
export const personSchema = object({
  id: string(),
  first_name: string().optional(),
  last_name: string().optional(),
  country: countrySchema.optional()
})
export type PersonType = z.infer<typeof personSchema>

/** @interface CoachType - Represents a coach with its full details */
export const coachSchema = personSchema
  .omit({
    country: true
  })
  .extend({
    years: string().optional(),
    labels: array(string())
  })
export type CoachType = z.infer<typeof coachSchema>
