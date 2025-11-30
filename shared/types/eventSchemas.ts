import { array, boolean, object, string, url, z } from "zod"
import {
  countrySchema,
  CurrencyEnum,
  DrawEnum,
  intToNumberSchema,
  LevelEnum,
  MatchTypeEnum,
  neoDateToStringSchema,
  personSchema,
  RoundEnum,
  StatusEnum,
  surfaceSchema,
  tourEnum,
  TourEnum,
  venueSchema
} from "./schemas"
import { editionSchema } from "./tournamentSchemas"

export const eventSchema = object({
  id: string(),
  sponsor_name: string().nullish(),
  category: string().optional(),
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional(),
  currency: CurrencyEnum.optional(),
  pm: intToNumberSchema.optional(),
  tfc: intToNumberSchema.optional(),
  updated_at: neoDateToStringSchema.optional(),
  venues: array(venueSchema).default([]),
  surface: surfaceSchema.optional(),
  tour: TourEnum.transform(val => tourEnum[val]),
  level: LevelEnum,
  edition: editionSchema.optional(),
  site_link: url().optional(),
  wiki_link: url().optional(),
  supervisors: array(personSchema).default([]),
  s_draw: string().optional(),
  s_link: url().optional(),
  d_draw: string().optional(),
  d_link: url().optional(),
  qs_draw: string().optional(),
  qs_link: url().optional(),
  qd_draw: string().optional(),
  qd_link: url().optional(),
  winners: array(
    object({
      type: MatchTypeEnum,
      team: array(personSchema)
    })
  ).default([])
})
export type EventType = z.infer<typeof eventSchema>

export const drawLinksSchema = eventSchema
  .pick({
    s_link: true,
    d_link: true,
    qs_link: true,
    qd_link: true,
    s_draw: true,
    d_draw: true,
    qs_draw: true,
    qd_draw: true
  })
  .extend({
    draw_type: string().optional(),
    draw_link: url().optional()
  })

export const awardSchema = object({
  id: string(),
  round: RoundEnum,
  number: intToNumberSchema,
  pm: intToNumberSchema.optional(),
  points: intToNumberSchema.optional(),
  type: MatchTypeEnum,
  currency: CurrencyEnum.nullish()
})
export type AwardType = z.infer<typeof awardSchema>

export const seedSchema = object({
  id: string(),
  withdrew: boolean(),
  draw: DrawEnum,
  rank: intToNumberSchema.nullish(),
  type: MatchTypeEnum,
  seed: intToNumberSchema,
  team: array(personSchema)
})
export type SeedType = z.infer<typeof seedSchema>

export const entryInfoSchema = object({
  id: string(),
  type: MatchTypeEnum,
  reason: string().nullish(),
  rank: intToNumberSchema.nullish(),
  relationship: string(),
  status: string().optional(),
  team: array(personSchema),
  q_status: string().optional(),
  teammate: string().nullish()
}).transform(data => {
  const getRelationship = (type: string) => {
    switch (type) {
      case "LUCKY_LOSER":
        return "Lucky Loser"
      case "ALTERNATE":
      case "Q_ALTERNATE":
        return "Alternate"
      case "DEFAULTED":
      case "Q_DEFAULTED":
        return "Default"
      case "QUALIFIED":
        return "Qualifier"
      case "LDA":
      case "Q_LDA":
        return "Last Direct Acceptance"
      case "WILD_CARD":
      case "Q_WILD_CARD":
        return "Wild Card"
      case "WITHDREW":
      case "Q_WITHDREW":
        return "Withdrawal"
      case "RETIRED":
      case "Q_RETIRED":
        return "Retirement"
      default:
        return "Walkover"
    }
  }

  const getDraw = (type: string) => {
    switch (type) {
      case "Q_ALTERNATE":
      case "Q_DEFAULTED":
      case "Q_LDA":
      case "Q_WILD_CARD":
      case "Q_WITHDREW":
      case "Q_RETIRED":
        return "Qualifying"
      default:
        return "Main"
    }
  }

  return {
    ...data,
    relationship: getRelationship(data.relationship),
    draw: getDraw(data.relationship)
  }
})
export type EntryInfoType = z.infer<typeof entryInfoSchema>

export const teamEntrySchema = object({
  id: string(),
  type: MatchTypeEnum.optional(),
  draws: array(DrawEnum).optional(),
  seed: intToNumberSchema.optional(),
  q_seed: intToNumberSchema.optional(),
  status: StatusEnum.optional(),
  q_status: StatusEnum.optional(),
  team: array(personSchema)
})
export type TeamEntryType = z.infer<typeof teamEntrySchema>

const entrySchema = object({
  draws: array(DrawEnum).optional(),
  rank: intToNumberSchema.nullish(),
  seed: intToNumberSchema.optional(),
  q_seed: intToNumberSchema.optional(),
  status: StatusEnum.optional(),
  q_status: StatusEnum.optional(),
  points: intToNumberSchema.optional(),
  pm: intToNumberSchema.optional()
})
export type EntryType = z.infer<typeof entrySchema>

export const playerEntrySchema = object({
  id: string(),
  first_name: string().nullish(),
  last_name: string().nullish(),
  country: countrySchema.nullish(),
  singles: entrySchema.nullish(),
  doubles: entrySchema.nullish()
}).transform(data => {
  return {
    ...data,
    singles: data.singles
      ? {
          ...data.singles,
          withdrew: !data.singles?.draws ? true : false
        }
      : undefined,
    doubles: data.doubles
      ? {
          ...data.doubles,
          withdrew: !data.doubles?.draws ? true : false
        }
      : undefined
  }
})
export type PlayerEntryType = z.infer<typeof playerEntrySchema>

export const resultsArchiveSchema = editionSchema.extend({
  events: array(
    eventSchema.extend({
      umpires: array(personSchema)
    })
  )
})
export type ResultsArchiveType = z.infer<typeof resultsArchiveSchema>
