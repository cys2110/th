

import { literal, number, object, string, union, z } from "zod"
import { int, Date as NeoDate } from "neo4j-driver"


export const numberToIntSchema = number().transform(val => int(val))


export const dateToNeoDateSchema = object({
  year: number(),
  month: number(),
  day: number()
}).transform(val => new NeoDate(val.year, val.month, val.day))


export const optionSchema = object({
  label: string(),
  value: union([string(), numberToIntSchema])
}).transform(({ value }) => value)


export const paginationSchema = object({
  skip: numberToIntSchema.default(int(0)),
  offset: numberToIntSchema.default(int(30)),
  sortField: z.array(sortFieldSchema).default([])
})


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
