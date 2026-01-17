import { Duration } from "neo4j-driver"
import { literal, number, object, string } from "zod"
import { dateToNeoDateSchema, optionSchema } from "./schemas"

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
  tournament: string(),
  edition: number(),
  tour: TourInputEnum,
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
  t1: optionSchema.optional(),
  t2: optionSchema.optional(),
  winner: literal(["t1", "t2"]).optional(),
  noOfSets: literal(["Best Of 3", "Best Of 5"]).optional(),
  team1: scoreFormSchema,
  team2: scoreFormSchema
}).transform(data => {
  const event = COUNTRY_DRAWS.includes(data.tournament) ? `${data.edition}-Country` : `${data.edition}-${data.tour}`

  const mid = data.id ?? `${event} ${data.type.charAt(0)} ${data.draw.charAt(0)} ${data.match_no}`

  let duration = null

  if (data.duration) {
    const parts = data.duration.split(":").map(part => parseInt(part, 10))
    const hours = parts.length === 3 ? parts[0] : 0
    const minutes = parts.length === 3 ? parts[1] : parts[0]
    const seconds = parts.length === 3 ? parts[2] : parts[1]

    const allSeconds = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
    duration = new Duration(0, 0, allSeconds, 0)
  }

  const newObject = {
    ...data,
    id: mid,
    event,
    team1: {
      ...data.team1,
      id: data.team1.id ?? `${mid} ${(data.t1 as string).replace(event, "").trim()}`
    },
    team2: {
      ...data.team2,
      id: data.team2.id ?? `${mid} ${(data.t2 as string).replace(event, "").trim()}`
    },
    match: {
      duration,
      incomplete: data.incomplete,
      court: data.court,
      date: data.date,
      group: data.group
    }
  }

  // Remove undefined keys
  Object.keys(newObject.match).forEach(
    key => newObject.match[key as keyof typeof newObject.match] === null && delete newObject.match[key as keyof typeof newObject.match]
  )
  Object.keys(newObject).forEach(key => newObject[key as keyof typeof newObject] === undefined && delete newObject[key as keyof typeof newObject])

  return newObject
})

export const countryMatchFormSchema = object({
  id: string().optional(),
  edition: number(),
  type: MatchTypeEnum,
  tie: string(),
  match_no: numberToIntSchema,
  incomplete: IncompleteEnum.nullish().default(null),
  court: string().nullish().default(null),
  date: dateToNeoDateSchema.nullish().default(null),
  duration: string().nullish().default(null),
  group: string().nullish().default(null),
  umpire: optionSchema.optional(),
  t1: optionSchema.optional(),
  t2: optionSchema.optional(),
  winner: literal(["t1", "t2"]).optional(),
  team1: scoreFormSchema,
  team2: scoreFormSchema
}).transform(data => {
  const event = `${data.edition}-Country`

  const mid = data.id ?? `${event} ${data.type.charAt(0)} M ${data.match_no}`

  let duration = null

  if (data.duration) {
    const parts = data.duration.split(":").map(part => parseInt(part, 10))
    const hours = parts.length === 3 ? parts[0] : 0
    const minutes = parts.length === 3 ? parts[1] : parts[0]
    const seconds = parts.length === 3 ? parts[2] : parts[1]

    const allSeconds = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
    duration = new Duration(0, 0, allSeconds, 0)
  }

  const newObject = {
    ...data,
    id: mid,
    event,
    team1: {
      ...data.team1,
      id: data.team1.id ?? `${mid} ${(data.t1 as string).replace(event, "").trim()}`
    },
    team2: {
      ...data.team2,
      id: data.team2.id ?? `${mid} ${(data.t2 as string).replace(event, "").trim()}`
    },
    match: {
      duration,
      incomplete: data.incomplete,
      court: data.court,
      date: data.date,
      group: data.group
    }
  }

  // Remove undefined keys
  Object.keys(newObject.match).forEach(
    key => newObject.match[key as keyof typeof newObject.match] === null && delete newObject.match[key as keyof typeof newObject.match]
  )
  Object.keys(newObject).forEach(key => newObject[key as keyof typeof newObject] === undefined && delete newObject[key as keyof typeof newObject])

  return newObject
})
