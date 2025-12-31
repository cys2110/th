/**
 * @module shared/types/countrySchemas
 * @description Country schemas shared across client and server side
 * @see module shared/types/enums
 * @see module shared/types/schemas
 * @see module shared/types/playerSchemas
 * @see module shared/types/editionSchemas
 */

import { z } from "zod"
import { playerSchema } from "./playerSchemas"
import { editionSchema } from "./editionSchemas"
import { MatchTypeEnum } from "./enums"

/** @interface CountryTitleType - Represents players who have won big titles for a country and the title details */
export const countryTitleSchema = playerSchema
  .pick({
    id: true,
    first_name: true,
    last_name: true,
    tour: true
  })
  .required({
    first_name: true,
    last_name: true
  })
  .extend({
    edition: editionSchema
      .pick({
        id: true,
        category: true,
        tournament: true,
        year: true
      })
      .extend({
        type: MatchTypeEnum
      })
  })
export type CountryTitleType = z.infer<typeof countryTitleSchema>

/** @interface CountryNumberOneType - Represents the number one players from a country */
export const countryNumberOneSchema = playerSchema
  .pick({
    id: true,
    first_name: true,
    last_name: true,
    tour: true,
    ch_singles: true,
    singles_ch_date: true,
    ch_doubles: true,
    doubles_ch_date: true
  })
  .required({
    first_name: true,
    last_name: true
  })
export type CountryNumberOneType = z.infer<typeof countryNumberOneSchema>
