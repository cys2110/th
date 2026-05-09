import { array, coerce, literal, number, object, string, url, z } from "zod"

export const PlayerUpdateSchema = object({
  id: string(),
  first_name: string(),
  last_name: string(),
  bh: literal(["One", "Two"]).optional(),
  dob: string().nullable().default(null),
  dod: string().nullable().default(null),
  height: number().nullable().default(null),
  hof: number().nullable().default(null),
  official_link: url().optional(),
  retired: number().nullable().default(null),
  rh: literal(["Right", "Left"]).optional(),
  turned_pro: number().nullable().default(null),
  wiki_link: url().optional(),
  countries: array(
    object({
      id: string().optional(),
      country: object({
        id: string(),
        name: string(),
        alpha_2: string().nullable().default(null),
        continent: ContinentEnum.optional(),
        icon: string().optional()
      }),
      start_date: string().nullable().default(null),
      end_date: string().nullable().default(null)
    })
  ),
  coaches: array(
    object({
      id: string().optional(),
      years: string().nullable().default(null),
      status: literal(["Current", "Former"]),
      coach: string()
    })
  )
})

export type PlayerUpdateType = z.infer<typeof PlayerUpdateSchema>

export const ScrapeDrawSchema = object({
  draw: DrawEnum,
  draw_size: number().int().positive().optional(),
  event_id: string(),
  format: literal([3, 5]),
  tournament_id: string(),
  year: string(),
  match_type: MatchTypeEnum
})

export type ScrapeDrawType = z.infer<typeof ScrapeDrawSchema>

export const ScrapeResultsSchema = object({
  tournament_id: string(),
  event_id: string(),
  year: string(),
  match_type: MatchTypeEnum
})

export type ScrapeResultsType = z.infer<typeof ScrapeResultsSchema>

export const ScrapeMatchesSchema = object({
  event_id: string(),
  tournament_id: string().optional(),
  year: string().optional(),
  draw: DrawEnum.optional(),
  match_type: MatchTypeEnum.optional(),
  draw_range: array(coerce.number()).default([]),
  skip: array(coerce.number()).default([]),
  links: array(string()).default([])
})

export type ScrapeMatchesType = z.infer<typeof ScrapeMatchesSchema>

export const ScrapeActivitySchema = object({
  tournament_id: string(),
  year: string(),
  match_type: MatchTypeEnum,
  category: string(),
  players: array(
    object({
      entry_id: string(),
      player_id: string(),
      icon: string(),
      name: string()
    })
  )
})

export type ScrapeActivityType = z.infer<typeof ScrapeActivitySchema>

export const SeedSchema = object({
  event_id: string(),
  entry_id: string(),
  seed: number(),
  draw: DrawEnum,
  match_type: MatchTypeEnum,
  rank: number().optional()
})

export type SeedType = z.infer<typeof SeedSchema>

export const EntryInfoSchema = object({
  relationship: string(),
  entry_id: string(),
  event_id: string(),
  draw: DrawEnum,
  status: StatusEnum.optional(),
  rank: number().optional(),
  reason: string().optional(),
  player_id: string().optional()
})

export type EntryInfoType = z.infer<typeof EntryInfoSchema>

export const EntrySchema = object({
  points: number().nullable().default(null),
  pm: number().nullable().default(null),
  match_type: MatchTypeEnum,
  event_id: string(),
  player_id: string(),
  rank: number().nullable().default(null),
  teammate_id: string().optional(),
  teammate_rank: number().optional()
})

export type EntryType = z.infer<typeof EntrySchema>

export const CountryEntrySchema = object({
  id: string(),
  country_id: string(),
  seed: number().optional(),
  event_id: string()
})

export type CountryEntryType = z.infer<typeof CountryEntrySchema>

export const PlayerCountryEntrySchema = object({
  entry_id: string(),
  player_id: string(),
  rank: number().nullable().default(null),
  doubles_rank: number().nullable().default(null)
})

export type PlayerCountryEntryType = z.infer<typeof PlayerCountryEntrySchema>

export const MatchScoreSchema = object({
  entry_id: string(),
  set_no: number().gte(1).lte(5),
  set: number().nullable().default(null),
  tb: number().nullable().default(null)
})

export type MatchScoreType = z.infer<typeof MatchScoreSchema>

export const MatchStatSchema = object({
  entry_id: string(),
  serve1_w: number().nullish().default(null),
  serve1: number().nullish().default(null),
  serve2_w: number().nullish().default(null),
  serve2: number().nullish().default(null),
  ret1_w: number().nullish().default(null),
  ret1: number().nullish().default(null),
  ret2_w: number().nullish().default(null),
  ret2: number().nullish().default(null),
  winners: number().nullish().default(null),
  ues: number().nullish().default(null),
  bps_converted: number().nullish().default(null),
  bp_opps: number().nullish().default(null),
  bps_saved: number().nullish().default(null),
  bps_faced: number().nullish().default(null),
  net_w: number().nullish().default(null),
  net: number().nullish().default(null),
  aces: number().nullish().default(null),
  dfs: number().nullish().default(null),
  serve_games: number().nullish().default(null),
  return_games: number().nullish().default(null),
  avg1_speed: number().nullish().default(null),
  avg2_speed: number().nullish().default(null),
  max_speed: number().nullish().default(null)
})

export type MatchStatType = z.infer<typeof MatchStatSchema>

export const MatchSchema = object({
  match_no: number(),
  court: string().nullable().default(null),
  date: string().nullable().default(null),
  tour: TourEnum,
  match_type: MatchTypeEnum,
  draw: DrawEnum,
  format: literal([3, 5]).default(3),
  incomplete: IncompleteEnum.nullish().default(null),
  duration: string().nullable().default(null),
  round_id: string(),
  team_1_id: string().nullable().default(null),
  team_2_id: string().nullable().default(null),
  winner_id: string().nullable().default(null),
  loser_id: string().nullable().default(null),
  umpire_id: string().nullable().default(null),
  sets: array(MatchScoreSchema).default([]),
  stats: array(MatchStatSchema).default([])
})

export type MatchType = z.infer<typeof MatchSchema>

export const CountryMatchSchema = MatchSchema.omit({
  tour: true
}).extend({
  tie_id: string().nullable().default(null),
  group_name: string().nullable().default(null)
})

export type CountryMatchType = z.infer<typeof CountryMatchSchema>
