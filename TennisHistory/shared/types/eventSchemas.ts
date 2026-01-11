import { array, boolean, object, string, url, z } from "zod"
import { countrySchema, intToNumberSchema, neoDateToStringSchema, personSchema, surfaceSchema, venueSchema } from "./schemas"
import { CurrencyEnum, DrawEnum, LevelEnum, MatchTypeEnum, RoundEnum, StatusEnum, tourEnumTransform, type DrawEnumType } from "./enums"
import { baseTournamentSchema } from "./tournamentSchemas"

export const eventSchema = object({
  category: string().optional(),
  currency: CurrencyEnum.optional(),
  end_date: neoDateToStringSchema.optional(),
  id: string(),
  level: LevelEnum,
  pm: intToNumberSchema.optional(),
  site_link: url().optional(),
  sponsor_name: string().optional(),
  start_date: neoDateToStringSchema.optional(),
  supervisors: array(personSchema.omit({ country: true })),
  surface: surfaceSchema.optional(),
  tfc: intToNumberSchema.optional(),
  tournament: baseTournamentSchema.optional(),
  tour: tourEnumTransform,
  venues: array(venueSchema).default([]),
  wiki_link: url().optional(),
  year: intToNumberSchema.optional()
})

// export const eventSchema = object({
//   updated_at: neoDateToStringSchema,
//   s_draw: string().optional(),
//   d_draw: string().optional(),
//   qs_draw: string().optional(),
//   qd_draw: string().optional(),
//   s_link: url().optional(),
//   d_link: url().optional(),
//   qs_link: url().optional(),
//   qd_link: url().optional()
// })
export type EventType = z.infer<typeof eventSchema>

export const awardSchema = object({
  id: string(),
  round: RoundEnum,
  number: intToNumberSchema.optional(),
  points: intToNumberSchema.optional(),
  pm: intToNumberSchema.optional(),
  currency: CurrencyEnum.optional(),
  type: MatchTypeEnum,
  tour: tourEnumTransform
})

export type AwardType = z.infer<typeof awardSchema>

export const seedSchema = object({
  id: string(),
  seed: intToNumberSchema.optional(),
  q_seed: intToNumberSchema.optional(),
  rank: intToNumberSchema.optional(),
  withdrew: boolean(),
  draw: DrawEnum,
  type: MatchTypeEnum,
  tour: tourEnumTransform,
  team: array(personSchema)
})

export type SeedType = z.infer<typeof seedSchema>

export const entryInfoSchema = object({
  id: string(),
  type: MatchTypeEnum,
  tour: tourEnumTransform,
  reason: string().optional(),
  rank: intToNumberSchema.optional(),
  relationship: string(),
  status: StatusEnum.optional(),
  team: array(personSchema),
  q_status: StatusEnum.optional(),
  teammate: string().optional()
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

  const getDraw = (type: string): DrawEnumType => {
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

export const entrySchema = personSchema.extend({
  id: string(),
  draws: array(DrawEnum),
  rank: intToNumberSchema.optional(),
  seed: intToNumberSchema.optional(),
  q_seed: intToNumberSchema.optional(),
  status: StatusEnum.optional(),
  q_status: StatusEnum.optional(),
  points: intToNumberSchema.optional(),
  pm: intToNumberSchema.optional()
})

export type EntryType = z.infer<typeof entrySchema>

export const teamEntrySchema = entrySchema
  .extend({
    type: MatchTypeEnum,
    tour: tourEnumTransform,
    team: array(
      personSchema.extend({
        rank: intToNumberSchema.optional()
      })
    )
  })
  .transform(data => ({
    ...data,
    withdrew: !data.draws.length
  }))

export type TeamEntryType = z.infer<typeof teamEntrySchema>

export const countryTeamSchema = countrySchema.extend({
  seed: intToNumberSchema.optional(),
  team: array(
    personSchema
      .omit({
        country: true
      })
      .extend({
        tour: tourEnumTransform,
        singles: intToNumberSchema.optional(),
        doubles: intToNumberSchema.optional()
      })
  ).optional()
})

export type CountryTeamType = z.infer<typeof countryTeamSchema>

export const playerEntrySchema = personSchema
  .extend({
    tour: tourEnumTransform,
    singles: entrySchema
      .partial({
        draws: true
      })
      .optional(),
    doubles: entrySchema
      .partial({
        draws: true
      })
      .optional()
  })
  .transform(data => ({
    ...data,
    singles: data.singles
      ? {
          ...data.singles,
          withdrew: !data.singles.draws?.length
        }
      : undefined,
    doubles: data.doubles
      ? {
          ...data.doubles,
          withdrew: !data.doubles.draws?.length
        }
      : undefined
  }))

export type PlayerEntryType = z.infer<typeof playerEntrySchema>
