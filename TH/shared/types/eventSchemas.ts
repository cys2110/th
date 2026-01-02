import { array, object, string, z } from "zod"
import { baseTournamentSchema } from "./tournamentSchemas"
import { intToNumberSchema, neoDateToStringSchema, personSchema, surfaceSchema } from "./schemas"
import { DrawEnum, LevelEnum, StatusEnum, tourEnumTransform } from "./enums"

export const eventSchema = object({
  category: string().optional(),
  end_date: neoDateToStringSchema.optional(),
  id: string(),
  level: LevelEnum,
  start_date: neoDateToStringSchema.optional(),
  surface: surfaceSchema.optional(),
  tournament: baseTournamentSchema,
  tour: tourEnumTransform,
  year: intToNumberSchema
})

export const entrySchema = personSchema.extend({
  id: string(),
  draws: array(DrawEnum),
  rank: intToNumberSchema.optional(),
  seed: intToNumberSchema.optional(),
  q_seed: intToNumberSchema.optional(),
  status: StatusEnum.optional(),
  q_status: StatusEnum.optional(),
  points: intToNumberSchema.optional(),
  pm: intToNumberSchema.optional()
})

export type EntryType = z.infer<typeof entrySchema>
