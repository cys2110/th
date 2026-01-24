import { int, Date as NeoDate } from "neo4j-driver"
import { array, number, object, string, union } from "zod"

export const numberToIntSchema = number("Invalid number").transform(val => int(val))

export const optionSchema = object({
  label: string(),
  value: union([string(), numberToIntSchema])
}).transform(({ value }) => value)

export const paginationSchema = object({
  itemsPerPage: numberToIntSchema.default(int(30)),
  skip: numberToIntSchema.default(int(0)),
  sortField: array(sortFieldSchema).default([])
})
