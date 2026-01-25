import { int, Date as NeoDate } from "neo4j-driver"
import { array, literal, number, object, string, union } from "zod"

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
  itemsPerPage: numberToIntSchema.default(int(30)),
  skip: numberToIntSchema.default(int(0)),
  sortField: array(sortFieldSchema).default([])
})

export const countryFormSchema = object({
  id: string("Country ID is required"),
  name: string("Country name is required"),
  continent: string("Continent is required"),
  alpha2: string()
    .optional()
    .refine(val => !val || val.length === 2, "Alpha-2 code must be 2 characters")
}).transform(data => {
  const { id, ...rest } = data
  return {
    id: id.toUpperCase(),
    country: { ...rest }
  }
})

export const personFormSchema = personSchema
  .pick({
    first_name: true,
    last_name: true
  })
  .extend({
    id: string().optional(),
    type: literal(["Supervisor", "Coach", "Umpire"])
  })
  .transform(data => {
    const { id, type, ...rest } = data

    return {
      id: id ?? `${data.first_name} ${data.last_name}`.trim(),
      type,
      person: { ...rest }
    }
  })

export const venueFormSchema = venueSchema
  .pick({
    name: true,
    city: true
  })
  .extend({
    id: string().optional(),
    country: optionSchema
  })
  .transform(data => {
    const { id, country, ...rest } = data

    return {
      id:
        id ??
        (data.name && data.name.includes(data.city) ? data.name
        : data.name ? `${data.name}, ${data.city}`
        : data.city),
      country,
      venue: { ...rest }
    }
  })
