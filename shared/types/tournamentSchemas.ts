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

export const tournamentSchema = object({
  id: intToNumberSchema,
  name: string(),
  tours: array(TourEnum.transform(val => tourEnum[val])).optional(),
  established: intToNumberSchema.optional(),
  abolished: intToNumberSchema.optional(),
  website: url().optional(),
  updated_at: neoDateToStringSchema.optional()
})
export type TournamentType = z.infer<typeof tournamentSchema>

export const editionSchema = object({
  id: intToNumberSchema,
  year: intToNumberSchema.optional(),
  currency: CurrencyEnum.optional(),
  tfc: intToNumberSchema.optional(),
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional(),
  updated_at: neoDateToStringSchema.optional(),
  tours: array(TourEnum.transform(val => tourEnum[val])).optional(),
  sponsor_name: string().optional(),
  category: string().optional(),
  draw_type: string().optional(),
  draw_link: url().optional(),
  wiki_link: url().optional(),
  surface: surfaceSchema.optional(),
  tournament: tournamentSchema
    .pick({
      id: true,
      name: true,
      tours: true
    })
    .optional(),
  venues: array(venueSchema).default([]),
  winners: array(
    object({
      type: MatchTypeEnum,
      tour: TourEnum.transform(val => tourEnum[val]),
      team: array(personSchema)
    })
  ).default([])
})
export type EditionType = z.infer<typeof editionSchema>
