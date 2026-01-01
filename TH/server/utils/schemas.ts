/**
 * @module server/utils/schemas
 * @description This module defines and exports common schemas used across the server API
 */

import { literal, number, object, string, union, z } from "zod"
import { int, Date as NeoDate } from "neo4j-driver"

/**
 * @function numberToIntSchema - Transforms a number to an Integer
 * @return {z.ZodEffects<z.ZodNumber, number, number>} - Transformed schema
 */
export const numberToIntSchema = number().transform(val => int(val))

/**
 * @function dateToNeoDateSchema - Transforms a date object to a Neo4j Date
 * @return {z.ZodEffects<z.ZodObject<{ year: z.ZodNumber; month: z.ZodNumber; day: z.ZodNumber; }, "strip", z.ZodTypeAny, { year: number; month: number; day: number; }, { year: number; month: number; day: number; }>, Neo4j.Date, { year: number; month: number; day: number; }>} - Transformed schema
 */
export const dateToNeoDateSchema = object({
  year: number(),
  month: number(),
  day: number()
}).transform(val => new NeoDate(val.year, val.month, val.day))

/** Describes the schema for an option */
export const optionSchema = object({
  label: string(),
  value: union([string(), numberToIntSchema])
}).transform(({ value }) => value)

/** Describes the schema when an API query is paginated */
export const paginationSchema = object({
  skip: numberToIntSchema.default(int(0)),
  offset: numberToIntSchema.default(int(30)),
  sortField: z.array(sortFieldSchema).default([])
})

/** Describes the schema for backend validation of a person form */
export const personFormSchema = object({
  id: string(),
  first_name: string().optional(),
  last_name: string().optional(),
  type: literal(["Supervisor", "Coach", "Umpire"])
}).transform(data => {
  const { id, type, ...rest } = data
  return {
    id,
    type,
    person: {
      ...rest
    }
  }
})
