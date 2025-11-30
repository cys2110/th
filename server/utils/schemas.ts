// server/utils/schemas.ts
import { array, literal, number, object, string, union, url, z } from "zod"
import { int, Date as NeoDate, Duration } from "neo4j-driver"

const currentYear = new Date().getFullYear()

const idSchema = union([string(), number()]).transform(val => {
  if (typeof val === "string") {
    if (isNaN(Number(val))) {
      return val
    } else {
      return numberToIntSchema.parse(Number(val))
    }
  } else {
    return numberToIntSchema.parse(val)
  }
})

export const numberToIntSchema = number().transform(val => int(val))

const dateToNeoDateSchema = object({
  year: number(),
  month: number(),
  day: number()
}).transform(val => new NeoDate(val.year, val.month, val.day))

const dateRangeSchema = object({
  start: dateToNeoDateSchema.optional(),
  end: dateToNeoDateSchema.optional()
})

const optionSchema = object({
  label: string(),
  value: union([string(), number()])
}).transform(({ value }) => value)

export const querySchema = object({
  id: idSchema.optional(),
  skip: numberToIntSchema.optional().default(int(0)),
  offset: numberToIntSchema.optional().default(int(40)),
  sortField: sortFieldSchema.optional().default([]),
  abolished: numberToIntSchema.nullish().default(null),
  established: numberToIntSchema.nullish().default(null),
  categories: array(string()).optional().default([]),
  coaches: array(optionSchema).optional().default([]),
  continents: array(string()).optional().default([]),
  countries: array(optionSchema).optional().default([]),
  date: dateToNeoDateSchema.nullish().default(null),
  dateRange: dateRangeSchema
    .nullish()
    .transform(val => (val?.start ? val : null))
    .default(null),
  drawType: DrawEnum.nullish().default(null),
  environment: EnvironmentEnum.nullish().default(null),
  levels: array(LevelEnum).optional().default([]),
  matchType: MatchTypeEnum.nullish().default(null),
  max_year: numberToIntSchema.nullish().default(null),
  min_year: numberToIntSchema.nullish().default(null),
  players: array(optionSchema).optional().default([]),
  round: string().nullish().default(null),
  status: literal(["Active", "Inactive"])
    .transform(val => {
      if (val === "Active") return true
      if (val === "Inactive") return false
      return null
    })
    .nullish()
    .default(null),
  supervisors: array(optionSchema).optional().default([]),
  surfaces: array(string()).optional().default([]),
  tournaments: array(optionSchema).optional().default([]),
  tours: array(TourEnum).optional().default([]),
  umpires: array(optionSchema).optional().default([]),
  venues: array(optionSchema).optional().default([]),
  year: numberToIntSchema.optional().default(int(currentYear)),
  years: array(numberToIntSchema).optional().default([])
})

export const venueFormSchema = object({
  id: string(),
  name: string().nullish(),
  city: string().nullish(),
  country: optionSchema.nullish()
})

export const editionFormSchema = object({
  id: numberToIntSchema,
  tournament: numberToIntSchema.optional(),
  tours: array(string()).optional(),
  surface: string().nullish(),
  year: numberToIntSchema.optional(),
  sponsor_name: string().nullish(),
  category: string().nullish(),
  currency: optionSchema.nullish(),
  tfc: numberToIntSchema.nullish(),
  draw_type: string().nullish(),
  draw_link: url().nullish(),
  wiki_link: url().nullish(),
  venues: array(optionSchema).optional(),
  dates: dateRangeSchema.optional()
})

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
  return {
    ...data,
    id: data.id ?? `${data.edition}-${data.tour}`
  }
})

export const personFormSchema = object({
  id: string(),
  first_name: string().optional(),
  last_name: string().optional(),
  type: literal(["Supervisor", "Coach", "Umpire"])
})

export const awardFormSchema = object({
  id: string(),
  event: string().optional(),
  tour: TourEnum.nullish(),
  type: MatchTypeEnum.nullish(),
  round: RoundEnum.nullish(),
  draw: DrawEnum.nullish(),
  number: numberToIntSchema.nullish(),
  points: numberToIntSchema.nullish(),
  pm: numberToIntSchema.nullish()
})

export const seedFormSchema = object({
  event: string().nullish(),
  id: optionSchema,
  type: MatchTypeEnum.nullish(),
  draw: DrawEnum,
  seed: numberToIntSchema.nullish(),
  rank: numberToIntSchema.nullish()
})

export const entryInfoFormSchema = object({
  id: optionSchema.nullish(),
  event: string(),
  relationship: string(),
  draw: DrawEnum,
  type: MatchTypeEnum.nullish(),
  teammate: string().nullish(),
  reason: string().nullish(),
  rank: numberToIntSchema.nullish(),
  players: array(optionSchema).optional()
}).transform(data => {
  const players = data.players
  return {
    ...data,
    player1: players?.[0] ?? null,
    player2: players?.[1] ?? null,
    entryId: `${data.event} ${players?.join(" ") ?? ""}`
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
  rank2: numberToIntSchema.nullish(),
  event: string().nullish(),
  player1: optionSchema.nullish(),
  player2: optionSchema.nullish()
})

export const playerFormSchema = object({
  id: string(),
  first_name: string().nullish(),
  last_name: string().nullish(),
  country: object({
    name: optionSchema,
    start_date: dateToNeoDateSchema.optional()
  }).nullish(),
  former_countries: array(
    object({
      name: optionSchema,
      dates: object({
        start: dateToNeoDateSchema.optional(),
        end: dateToNeoDateSchema.optional()
      }).optional()
    })
  ).nullish(),
  official_link: url().nullish(),
  wiki_link: url().nullish(),
  dob: dateToNeoDateSchema.optional(),
  dod: dateToNeoDateSchema.optional(),
  height: numberToIntSchema.nullish(),
  rh: string().nullish(),
  bh: string().nullish(),
  turned_pro: numberToIntSchema.nullish(),
  retired: numberToIntSchema.nullish(),
  hof: numberToIntSchema.nullish(),
  coaches: array(
    object({
      name: optionSchema,
      years: string().optional()
    })
  ).nullish(),
  former_coaches: array(
    object({
      name: optionSchema,
      years: string().optional()
    })
  ).nullish()
})

const scoreFormSchema = object({
  id: string().optional(),
  s1: numberToIntSchema.nullish().default(null),
  s2: numberToIntSchema.nullish().default(null),
  s3: numberToIntSchema.nullish().default(null),
  s4: numberToIntSchema.nullish().default(null),
  s5: numberToIntSchema.nullish().default(null),
  t1: numberToIntSchema.nullish().default(null),
  t2: numberToIntSchema.nullish().default(null),
  t3: numberToIntSchema.nullish().default(null),
  t4: numberToIntSchema.nullish().default(null),
  t5: numberToIntSchema.nullish().default(null),
  incomplete: IncompleteEnum.nullish().default(null),
  aces: numberToIntSchema.nullish().default(null),
  dfs: numberToIntSchema.nullish().default(null),
  serve1_w: numberToIntSchema.nullish().default(null),
  serve1: numberToIntSchema.nullish().default(null),
  serve2_w: numberToIntSchema.nullish().default(null),
  serve2: numberToIntSchema.nullish().default(null),
  ret1_w: numberToIntSchema.nullish().default(null),
  ret1: numberToIntSchema.nullish().default(null),
  ret2_w: numberToIntSchema.nullish().default(null),
  ret2: numberToIntSchema.nullish().default(null),
  bps_saved: numberToIntSchema.nullish().default(null),
  bps_faced: numberToIntSchema.nullish().default(null),
  bps_converted: numberToIntSchema.nullish().default(null),
  bp_opps: numberToIntSchema.nullish().default(null),
  net_w: numberToIntSchema.nullish().default(null),
  net: numberToIntSchema.nullish().default(null),
  winners: numberToIntSchema.nullish().default(null),
  ues: numberToIntSchema.nullish().default(null),
  max_speed: numberToIntSchema.nullish().default(null),
  avg1_speed: numberToIntSchema.nullish().default(null),
  avg2_speed: numberToIntSchema.nullish().default(null),
  serve_games: numberToIntSchema.nullish().default(null),
  return_games: numberToIntSchema.nullish().default(null)
})

export const matchFormSchema = object({
  id: string().optional(),
  event: string(),
  type: MatchTypeEnum,
  draw: DrawEnum,
  round: RoundEnum,
  match_no: numberToIntSchema,
  incomplete: IncompleteEnum.nullish().default(null),
  court: string().nullish().default(null),
  date: dateToNeoDateSchema.nullish().default(null),
  duration: string().nullish().default(null),
  group: string().nullish().default(null),
  umpire: optionSchema.optional(),
  team1: optionSchema.optional(),
  team2: optionSchema.optional(),
  winner: literal([1, 2]).optional(),
  noOfSets: literal(["BestOf3", "BestOf5"]).optional(),
  t1: scoreFormSchema,
  t2: scoreFormSchema
}).transform(data => {
  const mid = data.id ?? `${data.event} ${data.type.charAt(0)} ${data.draw.charAt(0)} ${data.match_no}`

  let duration = null

  if (data.duration) {
    const [hours, minutes, seconds] = data.duration.split(":")
    const allSeconds = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
    duration = new Duration(0, 0, allSeconds, 0)
  }

  return {
    ...data,
    id: mid,
    t1: {
      ...data.t1,
      id: data.t1.id ?? (data.team1 ? `${mid} ${(data.team1 as string).replace(data.event, "").trim()}` : undefined)
    },
    t2: {
      ...data.t2,
      id: data.t2.id ?? (data.team2 ? `${mid} ${(data.team2 as string).replace(data.event, "").trim()}` : undefined)
    },
    duration
  }
})

export const playerRecordSchema = object({
  tournament: tournamentSchema,
  round: RoundEnum,
  year: intToNumberSchema
})
