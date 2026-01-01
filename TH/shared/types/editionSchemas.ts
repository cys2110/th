/**
 * @module shared/types/editionSchemas
 * @description Edition schemas shared across client and server side
 * @see module shared/types/schemas
 * @see module shared/types/tournamentSchemas
 * @see module shared/types/enums
 */

import { boolean, object, string, z } from "zod"
import { intToNumberSchema, neoDateToStringSchema, surfaceSchema } from "./schemas"
import { baseTournamentSchema } from "./tournamentSchemas"
import { RoundEnum } from "./enums"

/** Describes a schema for a tournament edition with its details */
export const editionSchema = object({
  id: intToNumberSchema,
  category: string().optional(),
  end_date: neoDateToStringSchema.optional(),
  start_date: neoDateToStringSchema.optional(),
  surface: surfaceSchema.optional(),
  tournament: baseTournamentSchema,
  year: intToNumberSchema
})

/** Describes the schema for a player's recent events */
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
/** @type {PlayerRecentEventType} */
export type PlayerRecentEventType = z.infer<typeof playerRecentEventSchema>
