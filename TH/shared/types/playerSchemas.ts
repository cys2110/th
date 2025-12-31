/**
 * @module shared/types/playerSchemas
 * @description Player schemas shared across client and server side
 * @see module shared/types/schemas
 * @see module shared/types/enums
 */

import { array, z } from "zod"
import { coachSchema, intToNumberSchema, neoDateToStringSchema, personSchema } from "./schemas"
import { tourEnumTransform } from "./enums"

/** @interface PlayerType - Represents a player with its full details */
export const playerSchema = personSchema.extend({
  ch_doubles: intToNumberSchema.optional(),
  ch_singles: intToNumberSchema.optional(),
  coaches: array(coachSchema),
  doubles_ch_date: neoDateToStringSchema.optional(),
  max_year: intToNumberSchema,
  min_year: intToNumberSchema,
  singles_ch_date: neoDateToStringSchema.optional(),
  tour: tourEnumTransform
})

/** @interface BasePlayerType - Represents a player with its basic details */
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
