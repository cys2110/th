/**
 * @module server/api/utils/playerSchemas
 * @description This module defines and exports the player-related schemas used for server side validation
 * @see module server/api/utils/schemas
 */

import { array, number, string, union, z } from "zod"
import { numberToIntSchema, optionSchema, paginationSchema } from "./schemas"

/** @interface playerQuerySchema - Represents the schema for a player query */
export const playerQuerySchema = paginationSchema.extend({
  coaches: array(optionSchema).default([]),
  countries: array(optionSchema).default([]),
  grouping: array(string()).default([]),
  key: union([numberToIntSchema, string()]).nullable().default(null),
  players: array(optionSchema).default([]),
  tours: array(TourInputEnum).default([])
})
