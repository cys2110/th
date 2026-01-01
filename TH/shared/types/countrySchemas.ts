

import { z } from "zod"
import { playerSchema } from "./playerSchemas"
import { editionSchema } from "./editionSchemas"
import { MatchTypeEnum } from "./enums"


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
