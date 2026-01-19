import { array, object, union, z } from "zod"
import { TourEnum } from "./enums"
import { coachSchema, countrySchema, groupedResultsSchema, intToNumberSchema, personSchema } from "./schemas"

export const playerSchema = personSchema.extend({
  coaches: array(coachSchema).default([]),
  max_year: intToNumberSchema.optional(),
  min_year: intToNumberSchema.optional(),
  tour: TourEnum
})

export const playerSearchSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  country: true,
  tour: true
})

export type PlayerSearchType = z.infer<typeof playerSearchSchema>

export const basePlayerSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  country: true,
  coaches: true,
  max_year: true,
  min_year: true,
  tour: true
})

export type BasePlayerType = z.infer<typeof basePlayerSchema>

export const groupedPlayerResultsSchema = groupedResultsSchema.extend({
  group: union([countrySchema, object({ year: intToNumberSchema })]),
  subRows: array(basePlayerSchema)
})

export type GroupedPlayerResultsType = z.infer<typeof groupedPlayerResultsSchema>
