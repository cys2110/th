/**
 * @module shared/types/tournamentSchemas
 * @description Tournament schemas shared across client and server side
 * @see module shared/types/schemas
 */

import { object, string, z } from "zod"
import { intToNumberSchema } from "./schemas"

/** Defines the schema for a tournament with all details */
export const tournamentSchema = object({
  id: intToNumberSchema,
  name: string()
})
/** @type {TournamentType} */
export type TournamentType = z.infer<typeof tournamentSchema>

/** Defines the base schema for a tournament with minimal details */
export const baseTournamentSchema = tournamentSchema.pick({
  id: true,
  name: true
})
/** @type {BaseTournamentType} */
export type BaseTournamentType = z.infer<typeof baseTournamentSchema>
