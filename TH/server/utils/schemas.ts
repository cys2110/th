/**
 * @module server/api/utils/schemas
 * @description This module defines and exports common schemas used across the server API
 */

import { number, object, string, union, z } from "zod"
import { int, Date as NeoDate } from "neo4j-driver"

/** @function numberToIntSchema - Transforms a number to an Integer */
export const numberToIntSchema = number().transform(val => int(val))

/** @interface optionSchema - Represents the schema for an option */
export const optionSchema = object({
  label: string(),
  value: union([string(), numberToIntSchema])
}).transform(({ value }) => value)

/** @interface paginationSchema - Represents the schema when an API query is paginated */
export const paginationSchema = object({
  skip: numberToIntSchema.default(int(0)),
  offset: numberToIntSchema.default(int(30)),
  sortField: z.array(sortFieldSchema).default([])
})
