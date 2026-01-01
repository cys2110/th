/**
 * @module shared/types/schemas
 * @description Schemas shared across client and server side
 * @see module shared/types/enums
 */

import { array, literal, number, object, string, z } from "zod"
import { Integer, Date as NeoDate } from "neo4j-driver"
import { EnvironmentEnum, SurfaceEnum } from "./enums"

/** @function intToNumberSchema - Transforms an Integer to a number */
export const intToNumberSchema = z.instanceof(Integer).transform(val => val.toInt())

/** @function neoDateToStringSchema - Transforms a Neo4j cypher Date to a string */
export const neoDateToStringSchema = z.instanceof(NeoDate).transform(val => val.toStandardDate().toISOString().slice(0, 10))

/** Describes the schema for sorting fields */
export const sortFieldSchema = object({
  field: string(),
  direction: literal(["ASC", "DESC"])
})
/** @type {SortFieldType} */
export type SortFieldType = z.infer<typeof sortFieldSchema>

/** Describes the schema for a country */
export const countrySchema = object({
  id: string(),
  name: string(),
  alpha2: string().optional(),
  continent: string(),
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional()
})
/** @type {CountryType} */
export type CountryType = z.infer<typeof countrySchema>

/** Describes the schema for a person with basic identification details */
export const personSchema = object({
  id: string(),
  first_name: string().optional(),
  last_name: string().optional(),
  country: countrySchema.optional()
})
/** @type {PersonType} */
export type PersonType = z.infer<typeof personSchema>

/** Describes the schema for a coach with its full details */
export const coachSchema = personSchema
  .omit({
    country: true
  })
  .extend({
    years: string().optional(),
    labels: array(string())
  })
/** @type {CoachType} */
export type CoachType = z.infer<typeof coachSchema>

/** Describes the schema for a year */
export const yearSchema = number("Please enter a valid year").int("Please enter a valid year").positive("Please enter a valid year")

/** Describes the schema for a surface */
export const surfaceSchema = object({
  id: string(),
  environment: EnvironmentEnum,
  surface: SurfaceEnum
})
