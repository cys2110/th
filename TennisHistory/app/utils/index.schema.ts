import { array, literal, number, object, string, z } from "zod"

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
