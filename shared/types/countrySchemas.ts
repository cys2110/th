import { playerSchema } from "./playerSchemas"
import { MatchTypeEnum } from "./schemas"
import { editionSchema } from "./tournamentSchemas"
import { z } from "zod"

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
        type: MatchTypeEnum
      })
  })
export type CountryTitleType = z.infer<typeof countryTitleSchema>
