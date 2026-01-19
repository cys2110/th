import { array, number, object, string, union } from "zod"
import { int } from "neo4j-driver"

export const playerQuerySchema = paginationSchema.extend({
  coaches: array(optionSchema).default([]),
  countries: array(optionSchema).default([]),
  grouping: string().nullable().default(null),
  key: union([numberToIntSchema, string()]).nullable().default(null),
  max_year: number()
    .nullable()
    .default(null)
    .transform(val => (val ? int(val) : null)),
  min_year: number()
    .nullable()
    .default(null)
    .transform(val => (val ? int(val) : null)),
  players: array(optionSchema).default([]),
  tours: array(TourEnum).default([])
})

export const playerCreateSchema = playerSchema.pick({
  id: true,
  tour: true
})
