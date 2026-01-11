import { array, number, object, string, union, url, z } from "zod"

export const eventFormSchema = object({
  id: string().optional(),
  edition: numberToIntSchema.optional(),
  tour: TourInputEnum.optional(),
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

  const newObject = {
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

  // Remove undefined values
  Object.keys(newObject).forEach(key => newObject[key as keyof typeof newObject] === undefined && delete newObject[key as keyof typeof newObject])
  Object.keys(newObject.event).forEach(
    key => newObject.event[key as keyof typeof newObject.event] === undefined && delete newObject.event[key as keyof typeof newObject.event]
  )

  return newObject
})

export const awardFormSchema = object({
  id: string(),
  event: string().optional(),
  tour: TourInputEnum.optional(),
  type: MatchTypeEnum.optional(),
  round: RoundEnum.optional(),
  draw: DrawEnum.optional(),
  number: numberToIntSchema.optional(),
  points: numberToIntSchema.nullish(),
  pm: numberToIntSchema.nullish()
}).transform(data => {
  const { round, number, points, pm, ...rest } = data

  const newObject = {
    ...rest,
    round: {
      round,
      number,
      points,
      pm
    }
  }

  // Remove undefined values
  Object.keys(newObject.round).forEach(
    key => newObject.round[key as keyof typeof newObject.round] === undefined && delete newObject.round[key as keyof typeof newObject.round]
  )

  return newObject
})

export const countryRoundsSchema = object({
  id: string(),
  rounds: array(RoundEnum),
  groups: array(union([string(), number()]))
}).transform(data => {
  const { rounds, id, groups } = data

  const roundMapping = {
    Final: 1,
    Semifinals: 2,
    Quarterfinals: 3,
    "Round robin": 4
  }

  const mappedRounds = rounds
    .filter(round => round !== "Group stage")
    .map(round => ({
      id: `${id} ${roundEnum[round as keyof typeof roundEnum]}`,
      round,
      number: roundMapping[round as keyof typeof roundMapping]
    }))

  const groupRounds = groups.map((group, index) => ({
    id: `${id} G ${group}`,
    round: "Group stage",
    group: `Group ${group}`,
    number: index + 4
  }))

  return {
    id,
    rounds: [...mappedRounds, ...groupRounds]
  }
})

export const seedFormSchema = object({
  id: optionSchema,
  draw: DrawEnum.optional(),
  seed: numberToIntSchema.optional(),
  rank: numberToIntSchema.nullish(),
  type: MatchTypeEnum.optional(),
  edition: number(),
  tour: TourInputEnum
}).transform(data => ({
  ...data,
  event: `${data.edition}-${data.tour}`
}))

export const entryInfoFormSchema = object({
  id: optionSchema.optional(),
  relationship: string(),
  draw: DrawEnum,
  type: MatchTypeEnum.optional(),
  teammate: string().nullish(),
  reason: string().nullish(),
  rank: numberToIntSchema.nullish(),
  players: array(optionSchema).optional(),

  edition: number(),
  tour: TourInputEnum
}).transform(data => {
  const { players, teammate, reason, rank, edition, tour, ...rest } = data

  const event = `${edition}-${tour}`

  const newObject = {
    ...rest,
    player1: players?.[0] ?? null,
    player2: players?.[1] ?? null,
    entryId: `${event} ${players?.join(" ") ?? ""}`,
    properties: {
      teammate,
      reason,
      rank
    }
  }

  // Remove undefined values
  Object.keys(newObject.properties).forEach(
    key =>
      newObject.properties[key as keyof typeof newObject.properties] === undefined &&
      delete newObject.properties[key as keyof typeof newObject.properties]
  )
  Object.keys(newObject).forEach(key => newObject[key as keyof typeof newObject] === undefined && delete newObject[key as keyof typeof newObject])

  return newObject
})

export const entryFormSchema = object({
  id: string().optional(),
  tournament: string(),
  edition: number(),
  tour: TourInputEnum.optional(),
  type: MatchTypeEnum.optional(),
  seed: numberToIntSchema.nullish(),
  q_seed: numberToIntSchema.nullish(),
  status: optionSchema.nullish(),
  q_status: optionSchema.nullish(),
  points: numberToIntSchema.nullish(),
  pm: numberToIntSchema.nullish(),
  rank: numberToIntSchema.nullish(),
  rank2: numberToIntSchema.optional(),
  player1: optionSchema.optional(),
  player2: optionSchema.optional()
}).transform(data => {
  const { id, tournament, edition, tour, type, rank, rank2, player1, player2, ...rest } = data

  const event = COUNTRY_DRAWS.includes(tournament) ? `${edition}-Country` : `${edition}-${tour}`

  const newObject = {
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

  // Remove undefined values
  Object.keys(newObject.entry).forEach(
    key => newObject.entry[key as keyof typeof newObject.entry] === undefined && delete newObject.entry[key as keyof typeof newObject.entry]
  )
  Object.keys(newObject).forEach(key => newObject[key as keyof typeof newObject] === undefined && delete newObject[key as keyof typeof newObject])

  return newObject
})

export const countryEntryFormSchema = object({
  edition: number(),
  country: optionSchema,
  seed: numberToIntSchema.nullable().default(null)
}).transform(data => ({
  id: `${data.edition}-Country ${data.country}`,
  country: data.country,
  seed: data.seed
}))
