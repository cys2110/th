import { array, object, string, url, z } from "zod"

export const eventFormSchema = object({
  id: string().optional(),
  edition: numberToIntSchema.optional(),
  tour: TourEnum.optional(),
  level: LevelEnum.optional(),
  surface: string().nullish(),
  sponsor_name: string().nullish(),
  category: string().nullish(),
  currency: optionSchema.nullish(),
  pm: numberToIntSchema.nullish(),
  tfc: numberToIntSchema.nullish(),
  site_link: url().nullish(),
  wiki_link: url().nullish(),
  venues: array(optionSchema).optional(),
  dates: dateRangeSchema.optional(),
  supervisors: array(optionSchema).optional(),
  s_draw: string().nullish(),
  d_draw: string().nullish(),
  qs_draw: string().nullish(),
  qd_draw: string().nullish(),
  s_link: url().nullish(),
  d_link: url().nullish(),
  qs_link: url().nullish(),
  qd_link: url().nullish()
}).transform(data => {
  const { id, edition, tour, level, surface, venues, supervisors, dates, ...rest } = data

  return {
    id: data.id ?? `${data.edition}-${data.tour}`,
    edition,
    tour,
    level,
    surface,
    venues,
    supervisors,
    event: {
      ...rest,
      start_date: dates?.start,
      end_date: dates?.end
    }
  }
})

export const awardFormSchema = object({
  id: string(),
  event: string().optional(),
  tour: TourEnum.optional(),
  type: MatchTypeEnum.optional(),
  round: RoundEnum.optional(),
  draw: DrawEnum.optional(),
  number: numberToIntSchema.optional(),
  points: numberToIntSchema.nullish(),
  pm: numberToIntSchema.nullish()
}).transform(data => {
  const { round, number, points, pm, ...rest } = data
  return {
    ...rest,
    round: {
      round,
      number,
      points,
      pm
    }
  }
})

export const seedFormSchema = object({
  event: string().optional(),
  id: optionSchema,
  draw: DrawEnum.optional(),
  seed: numberToIntSchema.optional(),
  rank: numberToIntSchema.nullish(),
  type: MatchTypeEnum.optional()
})

export const entryInfoFormSchema = object({
  id: optionSchema.optional(),
  event: string(),
  relationship: string(),
  draw: DrawEnum,
  type: MatchTypeEnum.optional(),
  teammate: string().nullish(),
  reason: string().nullish(),
  rank: numberToIntSchema.nullish(),
  players: array(optionSchema).optional()
}).transform(data => {
  const { players, teammate, reason, rank, ...rest } = data
  return {
    ...rest,
    player1: players?.[0] ?? null,
    player2: players?.[1] ?? null,
    entryId: `${data.event} ${players?.join(" ") ?? ""}`,
    properties: {
      teammate,
      reason,
      rank
    }
  }
})

export const entryFormSchema = object({
  id: string().optional(),
  type: MatchTypeEnum,
  seed: numberToIntSchema.nullish(),
  q_seed: numberToIntSchema.nullish(),
  status: optionSchema.nullish(),
  q_status: optionSchema.nullish(),
  points: numberToIntSchema.nullish(),
  pm: numberToIntSchema.nullish(),
  rank: numberToIntSchema.nullish(),
  rank2: numberToIntSchema.optional(),
  event: string(),
  player1: optionSchema.optional(),
  player2: optionSchema.optional()
}).transform(data => {
  const { id, type, rank, rank2, event, player1, player2, ...rest } = data

  return {
    id,
    type,
    rank,
    rank2,
    event,
    player1,
    player2,
    entry: {
      ...rest
    }
  }
})
