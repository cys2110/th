

import { boolean, object, string, z } from "zod"
import { intToNumberSchema, neoDateToStringSchema, surfaceSchema } from "./schemas"
import { baseTournamentSchema } from "./tournamentSchemas"
import { RoundEnum } from "./enums"


export const editionSchema = object({
  id: intToNumberSchema,
  category: string().optional(),
  end_date: neoDateToStringSchema.optional(),
  start_date: neoDateToStringSchema.optional(),
  surface: surfaceSchema.optional(),
  tournament: baseTournamentSchema,
  year: intToNumberSchema
})


export const playerRecentEventSchema = editionSchema
  .pick({
    tournament: true,
    id: true,
    year: true,
    start_date: true,
    end_date: true,
    surface: true,
    category: true
  })
  .required({
    start_date: true,
    end_date: true,
    category: true,
    surface: true
  })
  .extend({
    round: RoundEnum,
    title: boolean()
  })

export type PlayerRecentEventType = z.infer<typeof playerRecentEventSchema>
