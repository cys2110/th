import { array, boolean, object, string, union, url, z } from "zod"
import { countrySchema, intToNumberSchema, neoDateToStringSchema, personSchema, surfaceSchema, venueSchema } from "./schemas"
import { baseTournamentSchema } from "./tournamentSchemas"
import { eventSchema } from "./eventSchemas"
import { CurrencyEnum, MatchTypeEnum, RoundEnum, tourEnumTransform } from "./enums"

export const editionSchema = object({
  category: string().optional(),
  currency: CurrencyEnum.optional(),
  draw_link: url().optional(),
  draw_type: string().optional(),
  end_date: neoDateToStringSchema.optional(),
  events: array(eventSchema).default([]),
  id: intToNumberSchema,
  sponsor_name: string().optional(),
  start_date: neoDateToStringSchema.optional(),
  surface: surfaceSchema.optional(),
  tfc: intToNumberSchema.optional(),
  tournament: baseTournamentSchema,
  tours: array(tourEnumTransform),
  venues: array(venueSchema).default([]),
  updated_at: neoDateToStringSchema,
  wiki_link: url().optional(),
  winner: union([
    object({
      type: MatchTypeEnum,
      tour: tourEnumTransform,
      team: array(personSchema)
    }),
    countrySchema
  ]).optional(),
  year: intToNumberSchema
})

export type EditionType = z.infer<typeof editionSchema>

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

export type PlayerRecentEventType = z.infer<typeof playerRecentEventSchema>

export const baseEditionSchema = editionSchema.pick({
  id: true,
  year: true,
  tours: true,
  sponsor_name: true,
  category: true,
  start_date: true,
  end_date: true,
  surface: true,
  venues: true,
  tfc: true,
  currency: true,
  winner: true
})
export type BaseEditionType = z.infer<typeof baseEditionSchema>

export const editionDetailsSchema = editionSchema.omit({
  winner: true,
  year: true
})

export type EditionDetailsType = z.infer<typeof editionDetailsSchema>

// export const resultsArchiveSchema = editionSchema
//   .pick({
//     id: true,
//     surface: true,
//     venues: true,
//     year: true,
//     category: true,
//     start_date: true,
//     end_date: true
//   })
//   .extend({
//     tournament: tournamentSchema.omit({
//       tours: true
//     }),
//     events: array(
//       eventSchema.extend({
//         umpires: array(personSchema)
//       })
//     )
//   })
// export type ResultsArchiveType = z.infer<typeof resultsArchiveSchema>
