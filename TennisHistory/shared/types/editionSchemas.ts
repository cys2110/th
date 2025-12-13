import { array, object, string, url, z } from "zod"
import {
  CurrencyEnum,
  intToNumberSchema,
  MatchTypeEnum,
  neoDateToStringSchema,
  personSchema,
  surfaceSchema,
  tourEnum,
  TourEnum,
  venueSchema
} from "./schemas"
import { baseTournamentSchema, tournamentSchema } from "./tournamentSchemas"
import { eventSchema } from "./eventSchemas"

export const editionSchema = object({
  id: intToNumberSchema,
  year: intToNumberSchema,
  currency: CurrencyEnum.optional(),
  tfc: intToNumberSchema.optional(),
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional(),
  updated_at: neoDateToStringSchema,
  tours: array(TourEnum.transform(val => tourEnum[val])),
  sponsor_name: string().optional(),
  category: string().optional(),
  draw_type: string().optional(),
  draw_link: url().optional(),
  wiki_link: url().optional(),
  surface: surfaceSchema.optional(),
  tournament: baseTournamentSchema,
  venues: array(venueSchema).default([]),
  winners: array(
    object({
      type: MatchTypeEnum,
      tour: TourEnum.transform(val => tourEnum[val]),
      team: array(personSchema)
    })
  ).default([])
  // events: array(eventSchema).default([])
})
export type EditionType = z.infer<typeof editionSchema>

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
  winners: true
})
export type BaseEditionType = z.infer<typeof baseEditionSchema>

export const editionDetailsSchema = editionSchema.omit({
  winners: true,
  year: true
})
export type EditionDetailsType = z.infer<typeof editionDetailsSchema>

export const resultsArchiveSchema = editionSchema
  .pick({
    id: true,
    surface: true,
    venues: true,
    year: true,
    category: true,
    start_date: true,
    end_date: true
  })
  .extend({
    tournament: tournamentSchema.omit({
      tours: true
    }),
    events: array(
      eventSchema.extend({
        umpires: array(personSchema)
      })
    )
  })
export type ResultsArchiveType = z.infer<typeof resultsArchiveSchema>
