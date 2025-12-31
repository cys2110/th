/**
 * @module shared/types/tournamentSchemas
 * @description Tournament schemas shared across client and server side
 * @see module shared/types/schemas
 */

import { object, string, z } from "zod"
import { intToNumberSchema } from "./schemas"

/** @interface TournamentType - Represents a tournament with its details */
export const tournamentSchema = object({
  id: intToNumberSchema,
  name: string()
})
export type TournamentType = z.infer<typeof tournamentSchema>

/** @interface TournamentType - Represents a tournament with its base details */
export const baseTournamentSchema = tournamentSchema.pick({
  id: true,
  name: true
})
export type BaseTournamentType = z.infer<typeof baseTournamentSchema>
