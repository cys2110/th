/**
 * @module shared/types/editionSchemas
 * @description Edition schemas shared across client and server side
 * @see module shared/types/schemas
 * @see module shared/types/tournamentSchemas
 */

import { object, string, z } from "zod"
import { intToNumberSchema } from "./schemas"
import { baseTournamentSchema } from "./tournamentSchemas"

/** @interface EditionType - Represents a tournament edition with its details */
export const editionSchema = object({
  id: intToNumberSchema,
  category: string().optional(),
  tournament: baseTournamentSchema,
  year: intToNumberSchema
})
