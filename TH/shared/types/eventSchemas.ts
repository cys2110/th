

import { object, string } from "zod"
import { baseTournamentSchema } from "./tournamentSchemas"
import { intToNumberSchema, neoDateToStringSchema, surfaceSchema } from "./schemas"
import { LevelEnum } from "./enums"

export const eventSchema = object({
  id: string(),
  tournament: baseTournamentSchema,
  category: string().optional(),
  year: intToNumberSchema,
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional(),
  surface: surfaceSchema.optional(),
  level: LevelEnum
})
