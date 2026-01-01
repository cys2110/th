/**
 * @module shared/types/eventSchemas
 * @description Event schemas shared across client and server side
 * @see module shared/types/schemas
 * @see module shared/types/enums
 * @see module shared/types/tournamentSchemas
 */

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
