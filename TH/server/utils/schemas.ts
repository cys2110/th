import { array, number, object, string, union } from "zod"
import { int } from "neo4j-driver"

export const numberToIntSchema = number("Invalid number").transform(val => int(val))

export const optionSchema = object({
  label: string(),
  value: union([string(), numberToIntSchema])
}).transform(({ value }) => value)

export const paginationSchema = object({
  skip: numberToIntSchema.default(int(0)),
  itemsPerPage: numberToIntSchema.default(int(20)),
  sortField: array(sortFieldSchema).default([])
})
