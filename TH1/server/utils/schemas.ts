import { array, literal, number, object, string, union } from "zod"
import { int, Date as NeoDate } from "neo4j-driver"

export const numberToIntSchema = number("Invalid number").transform(val => int(val))

export const dateToNeoDateSchema = object({
  year: number(),
  month: number(),
  day: number()
}).transform(val => new NeoDate(val.year, val.month, val.day))

export const idSchema = object({
  id: string("ID is required")
}).transform(({ id }) => ({
  id: numberToIntSchema.parse(Number(id))
}))

export const optionSchema = object({
  label: string(),
  value: union([string(), numberToIntSchema])
}).transform(({ value }) => value)

export const paginationSchema = object({
  skip: numberToIntSchema.default(int(0)),
  itemsPerPage: numberToIntSchema.default(int(20)),
  sortField: array(sortFieldSchema).default([])
})

export const personFormSchema = object({
  id: string().optional(),
  first_name: string("First name is required"),
  last_name: string("Last name is required"),
  type: literal(["Supervisor", "Coach", "Umpire"])
}).transform(data => {
  const { id, type, ...rest } = data

  return {
    id: id ?? `${data.first_name} ${data.last_name}`.trim(),
    type,
    person: {
      ...rest
    }
  }
})

export const venueFormSchema = object({
  id: string().optional(),
  name: string().optional(),
  city: string(),
  country: optionSchema
}).transform(data => {
  const { id, country, ...rest } = data

  return {
    id:
      id ??
      (data.name && data.name.includes(data.city) ? data.name
      : data.name ? `${data.name}, ${data.city}`
      : data.city),
    country,
    venue: {
      ...rest
    }
  }
})
