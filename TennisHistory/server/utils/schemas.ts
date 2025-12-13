import { array, literal, number, object, string, union } from "zod"
import { int, Date as NeoDate } from "neo4j-driver"

const currentYear = new Date().getFullYear()

export const idSchema = union([string(), number()]).transform(val => {
  if (typeof val === "string") {
    if (isNaN(Number(val))) {
      return val
    } else {
      return numberToIntSchema.parse(Number(val))
    }
  } else {
    return numberToIntSchema.parse(val)
  }
})

export const numberToIntSchema = number().transform(val => int(val))

export const optionSchema = object({
  label: string(),
  value: union([string(), number()])
}).transform(({ value }) => value)

export const dateToNeoDateSchema = object({
  year: number(),
  month: number(),
  day: number()
}).transform(val => new NeoDate(val.year, val.month, val.day))

export const dateRangeSchema = object({
  start: dateToNeoDateSchema.optional(),
  end: dateToNeoDateSchema.optional()
})

export const querySchema = object({
  id: idSchema.optional(),
  skip: numberToIntSchema.optional().default(int(0)),
  offset: numberToIntSchema.optional().default(int(30)),
  sortField: array(sortFieldSchema).optional().default([]),
  abolished: numberToIntSchema.nullish().default(null),
  categories: array(string()).optional().default([]),
  coaches: array(optionSchema).optional().default([]),
  continents: array(string()).optional().default([]),
  countries: array(optionSchema).optional().default([]),
  date: dateToNeoDateSchema.nullish().default(null),
  dateRange: dateRangeSchema
    .nullish()
    .transform(val => (val?.start ? val : null))
    .default(null),
  drawType: DrawEnum.nullish().default(null),
  environment: EnvironmentEnum.nullish().default(null),
  established: numberToIntSchema.nullish().default(null),
  levels: array(LevelEnum).optional().default([]),
  matchType: MatchTypeEnum.nullish().default(null),
  max_year: numberToIntSchema.nullish().default(null),
  min_year: numberToIntSchema.nullish().default(null),
  players: array(optionSchema).optional().default([]),
  status: literal(["Active", "Inactive"])
    .transform(val => {
      if (val === "Active") return true
      if (val === "Inactive") return false
      return null
    })
    .nullish()
    .default(null),
  supervisors: array(optionSchema).optional().default([]),
  surfaces: array(string()).optional().default([]),
  tournaments: array(optionSchema).optional().default([]),
  tours: array(TourEnum).optional().default([]),
  umpires: array(optionSchema).optional().default([]),
  venues: array(optionSchema).optional().default([]),
  year: numberToIntSchema.optional().default(int(currentYear)),
  years: array(numberToIntSchema).optional().default([])
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

export const venueFormSchema = object({
  id: string(),
  name: string().nullish(),
  city: string().optional(),
  country: optionSchema.optional()
}).transform(data => {
  const { id, country, ...rest } = data
  return {
    id,
    country,
    venue: {
      ...rest
    }
  }
})
