import { editionSchema } from "./editionSchemas"
import { playerSchema } from "./playerSchemas"
import { MatchTypeEnum } from "./schemas"
import { z } from "zod"
import { tournamentSchema } from "./tournamentSchemas"

export const countryTitleSchema = playerSchema
  .pick({
    id: true,
    first_name: true,
    last_name: true,
    tour: true
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
        type: MatchTypeEnum,
        tournament: tournamentSchema.pick({
          id: true,
          name: true
        })
      })
  })
export type CountryTitleType = z.infer<typeof countryTitleSchema>

export const countryNumberOneSchema = playerSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  ch_singles: true,
  singles_ch_date: true,
  ch_doubles: true,
  doubles_ch_date: true,
  tour: true,
  country: true
})
export type CountryNumberOneType = z.infer<typeof countryNumberOneSchema>
