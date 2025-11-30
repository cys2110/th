// shared/types/schemas.ts
import { array, boolean, int, literal, number, object, string, url, z } from "zod"
import { Integer, Date as NeoDate, Duration } from "neo4j-driver"
import { percentage } from "../utils/helpers"

export const TourEnum = z.enum(["ATP", "WTA", "Men", "Women"], "Please select a valid tour")
export type TourEnumType = z.infer<typeof TourEnum>

export const tourEnum = {
  ATP: "ATP",
  WTA: "WTA",
  Men: "ITF-M",
  Women: "ITF-W",
  "ITF-M": "Men",
  "ITF-W": "Women"
} as const

export const EnvironmentEnum = z.enum(["Indoor", "Outdoor"], "Please select a valid environment")

export const SurfaceEnum = z.enum(["Clay", "Grass", "Hard", "Carpet"], "Please select a valid surface")

export const MatchTypeEnum = z.enum(["Singles", "Doubles"], "Please select a valid match type")
export type MatchTypeEnumType = z.infer<typeof MatchTypeEnum>

export const DrawEnum = z.enum(["Main", "Qualifying"], "Please select a valid draw type")
export type DrawEnumType = z.infer<typeof DrawEnum>

export const LevelEnum = z.enum(["Tour", "Challenger", "ITF"], "Please select a valid level")

export const CurrencyEnum = z.enum(["USD", "EUR", "GBP", "AUD", "FRF"], "Please select a valid currency")
export type CurrencyEnumType = z.infer<typeof CurrencyEnum>

export const currencyEnum: Record<CurrencyEnumType, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  FRF: "\u20A3"
}

export const StatusEnum = z.enum(["AL", "CO", "JR", "LL", "NG", "Q", "PR", "SE", "WC"])
export type StatusEnumType = z.infer<typeof StatusEnum>

export const statusEnum: Record<StatusEnumType, string> = {
  AL: "Alternate",
  CO: "Collegian",
  JR: "Junior Reserved",
  LL: "Lucky Loser",
  NG: "Next Gen",
  Q: "Qualifier",
  PR: "Protected Ranking",
  SE: "Special Exempt",
  WC: "Wild Card"
}

export const RoundEnum = z.enum([
  "Win",
  "Final",
  "Semifinals",
  "Quarterfinals",
  "Round of 16",
  "Round of 32",
  "Round of 64",
  "Round of 128",
  "Qualifier",
  "Qualifying round 3",
  "Qualifying round 2",
  "Qualifying round 1",
  "Round robin",
  "Participation",
  "Alternate",
  "Day 1",
  "Day 2",
  "Day 3"
])
export type RoundEnumType = z.infer<typeof RoundEnum>

export const roundEnum: Record<RoundEnumType, string> = {
  "Day 1": "D1",
  "Day 2": "D2",
  "Day 3": "D3",
  Participation: "P",
  Alternate: "A",
  "Round robin": "RR",
  "Qualifying round 1": "Q1",
  "Qualifying round 2": "Q2",
  "Qualifying round 3": "Q3",
  Qualifier: "Q",
  "Round of 128": "R128",
  "Round of 64": "R64",
  "Round of 32": "R32",
  "Round of 16": "R16",
  Quarterfinals: "QF",
  Semifinals: "SF",
  Final: "F",
  Win: "W"
}

export const IncompleteEnum = z.enum(["B", "Def", "R", "WO"])
export type IncompleteEnumType = z.infer<typeof IncompleteEnum>

export const incompleteEnum: Record<IncompleteEnumType, string> = {
  B: "Bye",
  Def: "Defaulted",
  R: "Retired",
  WO: "Walkover"
}

export const yearSchema = number("Please enter a valid year").int("Please enter a valid year").positive("Please enter a valid year")

export const intToNumberSchema = z.instanceof(Integer).transform(val => val.toInt())

export const neoDateToStringSchema = z.instanceof(NeoDate).transform(val => val.toStandardDate().toISOString().slice(0, 10))

const durationToStringSchema = z.instanceof(Duration).transform(val => {
  const allSeconds = (val.seconds as Integer).toInt()
  const hours = Math.floor(allSeconds / 3600)
  const minutes = Math.floor((allSeconds % 3600) / 60)
  const seconds = allSeconds % 60
  return `${hours > 0 ? String(hours).padStart(2, "0") + ":" : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
})

export const sortFieldSchema = array(
  object({
    field: string(),
    direction: literal(["ASC", "DESC"])
  })
)
export type SortFieldType = z.infer<typeof sortFieldSchema>

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

export const countrySchema = object({
  id: string(),
  name: string(),
  alpha2: string().optional(),
  continent: string()
})
export type CountryType = z.infer<typeof countrySchema>

export const surfaceSchema = object({
  id: string(),
  environment: EnvironmentEnum,
  surface: SurfaceEnum
})

const venueSchema = object({
  id: string(),
  name: string().optional(),
  city: string(),
  country: countrySchema
})
export type VenueType = z.infer<typeof venueSchema>

export const personSchema = object({
  id: string(),
  first_name: string().nullish(),
  last_name: string().nullish(),
  country: countrySchema.nullish(),
  rank: intToNumberSchema.nullish(),
  labels: array(string()).optional(),
  years: string().optional()
})
export type PersonType = z.infer<typeof personSchema>

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

export const playerSchema = object({
  age: intToNumberSchema.optional(),
  bh: literal(["One", "Two"]).optional(),
  ch_doubles: intToNumberSchema.optional(),
  ch_singles: intToNumberSchema.optional(),
  coaches: array(personSchema).optional(),
  country: countrySchema
    .extend({
      start_date: neoDateToStringSchema.nullish()
    })
    .optional(),
  current_doubles: intToNumberSchema.optional(),
  current_singles: intToNumberSchema.optional(),
  dob: neoDateToStringSchema.optional(),
  dod: neoDateToStringSchema.optional(),
  doubles_ch_date: neoDateToStringSchema.optional(),
  first_name: string().optional(),
  former_coaches: array(personSchema).optional(),
  former_countries: array(
    countrySchema.extend({
      start_date: neoDateToStringSchema.optional(),
      end_date: neoDateToStringSchema.optional()
    })
  ).optional(),
  height: intToNumberSchema.optional(),
  hof: intToNumberSchema.optional(),
  id: string(),
  last_name: string().optional(),
  max_year: intToNumberSchema.optional(),
  min_year: intToNumberSchema.optional(),
  official_link: url().optional(),
  pm: intToNumberSchema.optional(),
  retired: intToNumberSchema.optional(),
  rh: literal(["Right", "Left"]).optional(),
  singles_ch_date: neoDateToStringSchema.optional(),
  site_link: url().optional(),
  tour: TourEnum.transform(val => tourEnum[val]).optional(),
  turned_pro: intToNumberSchema.optional(),
  updated_at: neoDateToStringSchema.optional(),
  wiki_link: url().optional(),
  years: array(intToNumberSchema).optional()
})
export type PlayerType = z.infer<typeof playerSchema>

const wlMainSchema = object({
  singles: object({
    wl: string(),
    titles: number()
  }),
  doubles: object({
    wl: string(),
    titles: number()
  })
})
export const wlSchema = object({
  label: string(),
  total: wlMainSchema,
  main: wlMainSchema,
  qualifying: object({
    singles: string(),
    doubles: string()
  })
})
export type WlType = z.infer<typeof wlSchema>

export const playerH2HSchema = object({
  opponent: personSchema,
  matches: intToNumberSchema,
  wins: intToNumberSchema
})
export type PlayerH2HType = z.infer<typeof playerH2HSchema>

export const scoreFormSchema = object({
  id: string(),
  s1: intToNumberSchema.nullish(),
  s2: intToNumberSchema.nullish(),
  s3: intToNumberSchema.nullish(),
  s4: intToNumberSchema.nullish(),
  s5: intToNumberSchema.nullish(),
  t1: intToNumberSchema.nullish(),
  t2: intToNumberSchema.nullish(),
  t3: intToNumberSchema.nullish(),
  t4: intToNumberSchema.nullish(),
  t5: intToNumberSchema.nullish(),
  incomplete: IncompleteEnum.nullish(),
  aces: intToNumberSchema.optional(),
  dfs: intToNumberSchema.optional(),
  serve1_w: intToNumberSchema.optional(),
  serve1: intToNumberSchema.optional(),
  serve2_w: intToNumberSchema.optional(),
  serve2: intToNumberSchema.optional(),
  ret1_w: intToNumberSchema.optional(),
  ret1: intToNumberSchema.optional(),
  ret2_w: intToNumberSchema.optional(),
  ret2: intToNumberSchema.optional(),
  bps_saved: intToNumberSchema.optional(),
  bps_faced: intToNumberSchema.optional(),
  bps_converted: intToNumberSchema.optional(),
  bp_opps: intToNumberSchema.optional(),
  net_w: intToNumberSchema.optional(),
  net: intToNumberSchema.optional(),
  winners: intToNumberSchema.optional(),
  ues: intToNumberSchema.optional(),
  max_speed: intToNumberSchema.optional(),
  avg1_speed: intToNumberSchema.optional(),
  avg2_speed: intToNumberSchema.optional(),
  serve_games: intToNumberSchema.optional(),
  return_games: intToNumberSchema.optional()
})

export const matchSchema = object({
  id: string(),
  noOfSets: intToNumberSchema.nullish(),
  match_no: intToNumberSchema,
  duration: durationToStringSchema.optional(),
  date: neoDateToStringSchema.optional(),
  court: string().optional(),
  draw: DrawEnum.optional(),
  type: MatchTypeEnum.optional(),
  round: RoundEnum,
  round_no: intToNumberSchema.optional(),
  umpire: personSchema.nullish(),
  stats: boolean().optional(),
  incomplete: IncompleteEnum.nullish(),
  sets: array(array(array(intToNumberSchema.nullable()))).optional(),
  winner: teamEntrySchema.nullish(),
  loser: teamEntrySchema.nullish(),
  t1: teamEntrySchema.nullish(),
  t2: teamEntrySchema.nullish(),
  team1: scoreFormSchema.nullish(),
  team2: scoreFormSchema.nullish(),
  winning_team: literal(["t1", "t2"]).nullish(),
  surface: surfaceSchema.nullish(),
  start_date: neoDateToStringSchema.optional(),
  end_date: neoDateToStringSchema.optional(),
  tournament: string().optional()
})
export type MatchType = z.infer<typeof matchSchema>

export const matchStatsSchema = matchSchema.transform(data => {
  const { team1, team2, ...rest } = data

  return {
    ...rest,
    team1: {
      s1: team1?.s1,
      s2: team1?.s2,
      s3: team1?.s3,
      s4: team1?.s4,
      s5: team1?.s5,
      t1: team1?.t1,
      t2: team1?.t2,
      t3: team1?.t3,
      t4: team1?.t4,
      t5: team1?.t5,
      incomplete: team1?.incomplete
    },
    team2: {
      s1: team2?.s1,
      s2: team2?.s2,
      s3: team2?.s3,
      s4: team2?.s4,
      s5: team2?.s5,
      t1: team2?.t1,
      t2: team2?.t2,
      t3: team2?.t3,
      t4: team2?.t4,
      t5: team2?.t5,
      incomplete: team2?.incomplete
    },
    stats: [
      {
        label: "Aces",
        category: "Service Stats",
        t1: `${team1?.aces ?? 0}`,
        t2: `${team2?.aces ?? 0}`,
        t1_pc: (team1?.aces ?? 0) + (team2?.aces ?? 0) === 0 ? 0 : percentage(team1?.aces ?? 0, (team1?.aces ?? 0) + (team2?.aces ?? 0)),
        t2_pc: (team1?.aces ?? 0) + (team2?.aces ?? 0) === 0 ? 0 : percentage(team2?.aces ?? 0, (team1?.aces ?? 0) + (team2?.aces ?? 0))
      },
      {
        label: "Double faults",
        category: "Service Stats",
        low: true,
        t1: `${team1?.dfs ?? 0}`,
        t2: `${team2?.dfs ?? 0}`,
        t1_pc: (team1?.dfs ?? 0) + (team2?.dfs ?? 0) === 0 ? 0 : percentage(team1?.dfs ?? 0, (team1?.dfs ?? 0) + (team2?.dfs ?? 0)),
        t2_pc: (team1?.dfs ?? 0) + (team2?.dfs ?? 0) === 0 ? 0 : percentage(team2?.dfs ?? 0, (team1?.dfs ?? 0) + (team2?.dfs ?? 0))
      },
      {
        label: "First serve",
        category: "Service Stats",
        percent: true,
        t1: `${team1?.serve1 ?? 0}/${(team1?.serve1 ?? 0) + (team1?.serve2 ?? 0)}`,
        t2: `${team2?.serve1 ?? 0}/${(team2?.serve1 ?? 0) + (team2?.serve2 ?? 0)}`,
        t1_pc: (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) === 0 ? 0 : percentage(team1?.serve1 ?? 0, (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0)),
        t2_pc: (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) === 0 ? 0 : percentage(team2?.serve1 ?? 0, (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0))
      },
      {
        label: "1st serve points won",
        category: "Service Stats",
        percent: true,
        t1: `${team1?.serve1_w ?? 0}/${team1?.serve1 ?? 0}`,
        t2: `${team2?.serve1_w ?? 0}/${team2?.serve1 ?? 0}`,
        t1_pc: team1?.serve1 === 0 || team1?.serve1 === undefined ? 0 : percentage(team1!.serve1_w ?? 0, team1!.serve1 ?? 0),
        t2_pc: team2?.serve1 === 0 || team2?.serve1 === undefined ? 0 : percentage(team2!.serve1_w ?? 0, team2!.serve1 ?? 0)
      },
      {
        label: "2nd serve points won",
        category: "Service Stats",
        percent: true,
        t1: `${team1?.serve2_w ?? 0}/${team1?.serve2 ?? 0}`,
        t2: `${team2?.serve2_w ?? 0}/${team2?.serve2 ?? 0}`,
        t1_pc: team1?.serve2 === 0 || team1?.serve2 === undefined ? 0 : percentage(team1!.serve2_w ?? 0, team1!.serve2 ?? 0),
        t2_pc: team2?.serve2 === 0 || team2?.serve2 === undefined ? 0 : percentage(team2!.serve2_w ?? 0, team2!.serve2 ?? 0)
      },
      {
        label: "Break points saved",
        category: "Service Stats",
        percent: true,
        t1: `${team1?.bps_saved ?? 0}/${team1?.bps_faced ?? 0}`,
        t2: `${team2?.bps_saved ?? 0}/${team2?.bps_faced ?? 0}`,
        t1_pc: team1?.bps_faced === 0 || team1?.bps_faced === undefined ? 0 : percentage(team1!.bps_saved ?? 0, team1!.bps_faced ?? 0),
        t2_pc: team2?.bps_faced === 0 || team2?.bps_faced === undefined ? 0 : percentage(team2!.bps_saved ?? 0, team2!.bps_faced ?? 0)
      },
      {
        label: "Service games won",
        category: "Service Stats",
        percent: true,
        t1: `${(team1?.serve_games ?? 0) - (team2?.bps_converted ?? 0)}/${team1?.serve_games ?? 0}`,
        t2: `${(team2?.serve_games ?? 0) - (team1?.bps_converted ?? 0)}/${team2?.serve_games ?? 0}`,
        t1_pc:
          team1?.serve_games === 0 || team1?.serve_games === undefined
            ? 0
            : percentage((team1!.serve_games ?? 0) - (team2!.bps_converted ?? 0), team1!.serve_games ?? 0),
        t2_pc:
          team2?.serve_games === 0 || team2?.serve_games === undefined
            ? 0
            : percentage((team2!.serve_games ?? 0) - (team1!.bps_converted ?? 0), team2!.serve_games ?? 0)
      },
      {
        label: "1st serve return points won",
        category: "Return Stats",
        percent: true,
        t1: `${team1?.ret1_w ?? 0}/${team1?.ret1 ?? 0}`,
        t2: `${team2?.ret1_w ?? 0}/${team2?.ret1 ?? 0}`,
        t1_pc: team1?.ret1 === 0 || team1?.ret1 === undefined ? 0 : percentage(team1!.ret1_w ?? 0, team1!.ret1 ?? 0),
        t2_pc: team2?.ret1 === 0 || team2?.ret1 === undefined ? 0 : percentage(team2!.ret1_w ?? 0, team2!.ret1 ?? 0)
      },
      {
        label: "2nd serve return points won",
        category: "Return Stats",
        percent: true,
        t1: `${team1?.ret2_w ?? 0}/${team1?.ret2 ?? 0}`,
        t2: `${team2?.ret2_w ?? 0}/${team2?.ret2 ?? 0}`,
        t1_pc: team1?.ret2 === 0 || team1?.ret2 === undefined ? 0 : percentage(team1!.ret2_w ?? 0, team1!.ret2 ?? 0),
        t2_pc: team2?.ret2 === 0 || team2?.ret2 === undefined ? 0 : percentage(team2!.ret2_w ?? 0, team2!.ret2 ?? 0)
      },
      {
        label: "Break points converted",
        category: "Return Stats",
        percent: true,
        t1: `${team1?.bps_converted ?? 0}/${team1?.bp_opps ?? 0}`,
        t2: `${team2?.bps_converted ?? 0}/${team2?.bp_opps ?? 0}`,
        t1_pc: team1?.bp_opps === 0 || team1?.bp_opps === undefined ? 0 : percentage(team1!.bps_converted ?? 0, team1!.bp_opps ?? 0),
        t2_pc: team2?.bp_opps === 0 || team2?.bp_opps === undefined ? 0 : percentage(team2!.bps_converted ?? 0, team2!.bp_opps ?? 0)
      },
      {
        label: "Return games won",
        category: "Return Stats",
        percent: true,
        t1: `${team1?.bps_converted ?? 0}/${team1?.return_games ?? 0}`,
        t2: `${team2?.bps_converted ?? 0}/${team2?.return_games ?? 0}`,
        t1_pc: team1?.return_games === 0 || team1?.return_games === undefined ? 0 : percentage(team1!.bps_converted ?? 0, team1!.return_games ?? 0),
        t2_pc: team2?.return_games === 0 || team2?.return_games === undefined ? 0 : percentage(team2!.bps_converted ?? 0, team2!.return_games ?? 0)
      },
      {
        label: "Winners",
        category: "Points Stats",
        t1: `${team1?.winners ?? 0}`,
        t2: `${team2?.winners ?? 0}`,
        t1_pc:
          (team1?.winners ?? 0) + (team2?.winners ?? 0) === 0 ? 0 : percentage(team1?.winners ?? 0, (team1?.winners ?? 0) + (team2?.winners ?? 0)),
        t2_pc:
          (team1?.winners ?? 0) + (team2?.winners ?? 0) === 0 ? 0 : percentage(team2?.winners ?? 0, (team1?.winners ?? 0) + (team2?.winners ?? 0))
      },
      {
        label: "Unforced errors",
        category: "Points Stats",
        t1: `${team1?.ues ?? 0}`,
        t2: `${team2?.ues ?? 0}`,
        t1_pc: (team1?.ues ?? 0) + (team2?.ues ?? 0) === 0 ? 0 : percentage(team1?.ues ?? 0, (team1?.ues ?? 0) + (team2?.ues ?? 0)),
        t2_pc: (team1?.ues ?? 0) + (team2?.ues ?? 0) === 0 ? 0 : percentage(team2?.ues ?? 0, (team1?.ues ?? 0) + (team2?.ues ?? 0)),
        low: true
      },
      {
        label: "Net points won",
        category: "Points Stats",
        percent: true,
        t1: `${team1?.net_w ?? 0}/${team1?.net ?? 0}`,
        t2: `${team2?.net_w ?? 0}/${team2?.net ?? 0}`,
        t1_pc: team1?.net === 0 || team1?.net === undefined ? 0 : percentage(team1!.net_w ?? 0, team1!.net ?? 0),
        t2_pc: team2?.net === 0 || team2?.net === undefined ? 0 : percentage(team2!.net_w ?? 0, team2!.net ?? 0)
      },
      {
        label: "Service points won",
        category: "Points Stats",
        percent: true,
        t1: `${(team1?.serve1_w ?? 0) + (team1?.serve2_w ?? 0)}/${(team1?.serve1 ?? 0) + (team1?.serve2 ?? 0)}`,
        t2: `${(team2?.serve1_w ?? 0) + (team2?.serve2_w ?? 0)}/${(team2?.serve1 ?? 0) + (team2?.serve2 ?? 0)}`,
        t1_pc:
          (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) === 0
            ? 0
            : percentage((team1?.serve1_w ?? 0) + (team1?.serve2_w ?? 0), (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0)),
        t2_pc:
          (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) === 0
            ? 0
            : percentage((team2?.serve1_w ?? 0) + (team2?.serve2_w ?? 0), (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0))
      },
      {
        label: "Return points won",
        category: "Points Stats",
        percent: true,
        t1: `${(team1?.ret1_w ?? 0) + (team1?.ret2_w ?? 0)}/${(team1?.ret1 ?? 0) + (team1?.ret2 ?? 0)}`,
        t2: `${(team2?.ret1_w ?? 0) + (team2?.ret2_w ?? 0)}/${(team2?.ret1 ?? 0) + (team2?.ret2 ?? 0)}`,
        t1_pc:
          (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0) === 0
            ? 0
            : percentage((team1?.ret1_w ?? 0) + (team1?.ret2_w ?? 0), (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0)),
        t2_pc:
          (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0) === 0
            ? 0
            : percentage((team2?.ret1_w ?? 0) + (team2?.ret2_w ?? 0), (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0))
      },
      {
        label: "Total points won",
        category: "Points Stats",
        percent: true,
        t1: `${(team1?.serve1_w ?? 0) + (team1?.serve2_w ?? 0) + (team1?.ret1_w ?? 0) + (team1?.ret2_w ?? 0)}/${
          (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) + (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0)
        }`,
        t2: `${(team2?.serve1_w ?? 0) + (team2?.serve2_w ?? 0) + (team2?.ret1_w ?? 0) + (team2?.ret2_w ?? 0)}/${
          (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) + (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0)
        }`,
        t1_pc:
          (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) + (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0) === 0
            ? 0
            : percentage(
                (team1?.serve1_w ?? 0) + (team1?.serve2_w ?? 0) + (team1?.ret1_w ?? 0) + (team1?.ret2_w ?? 0),
                (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) + (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0)
              ),
        t2_pc:
          (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) + (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0) === 0
            ? 0
            : percentage(
                (team2?.serve1_w ?? 0) + (team2?.serve2_w ?? 0) + (team2?.ret1_w ?? 0) + (team2?.ret2_w ?? 0),
                (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) + (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0)
              )
      },
      {
        label: "Max speed (km/h)",
        category: "Service Speed",
        t1: `${team1?.max_speed ?? 0}`,
        t2: `${team2?.max_speed ?? 0}`,
        t1_pc:
          (team1?.max_speed ?? 0) + (team2?.max_speed ?? 0) === 0
            ? 0
            : percentage(team1?.max_speed ?? 0, (team1?.max_speed ?? 0) + (team2?.max_speed ?? 0)),
        t2_pc:
          (team1?.max_speed ?? 0) + (team2?.max_speed ?? 0) === 0
            ? 0
            : percentage(team2?.max_speed ?? 0, (team1?.max_speed ?? 0) + (team2?.max_speed ?? 0))
      },
      {
        label: "1st serve average speed (km/h)",
        category: "Service Speed",
        t1: `${team1?.avg1_speed ?? 0}`,
        t2: `${team2?.avg1_speed ?? 0}`,
        t1_pc:
          (team1?.avg1_speed ?? 0) + (team2?.avg1_speed ?? 0) === 0
            ? 0
            : percentage(team1?.avg1_speed ?? 0, (team1?.avg1_speed ?? 0) + (team2?.avg1_speed ?? 0)),
        t2_pc:
          (team1?.avg1_speed ?? 0) + (team2?.avg1_speed ?? 0) === 0
            ? 0
            : percentage(team2?.avg1_speed ?? 0, (team1?.avg1_speed ?? 0) + (team2?.avg1_speed ?? 0))
      },
      {
        label: "2nd serve average speed (km/h)",
        category: "Service Speed",
        t1: `${team1?.avg2_speed ?? 0}`,
        t2: `${team2?.avg2_speed ?? 0}`,
        t1_pc:
          (team1?.avg2_speed ?? 0) + (team2?.avg2_speed ?? 0) === 0
            ? 0
            : percentage(team1?.avg2_speed ?? 0, (team1?.avg2_speed ?? 0) + (team2?.avg2_speed ?? 0)),
        t2_pc:
          (team1?.avg2_speed ?? 0) + (team2?.avg2_speed ?? 0) === 0
            ? 0
            : percentage(team2?.avg2_speed ?? 0, (team1?.avg2_speed ?? 0) + (team2?.avg2_speed ?? 0))
      }
    ]
  }
})
export type MatchStatsType = z.infer<typeof matchStatsSchema>

export const matchFormDetailsSchema = object({
  id: string(),
  type: MatchTypeEnum,
  draw: DrawEnum,
  round: RoundEnum,
  match_no: intToNumberSchema,
  incomplete: IncompleteEnum.optional(),
  court: string().optional(),
  date: neoDateToStringSchema.optional(),
  duration: durationToStringSchema.optional(),
  umpire: personSchema.nullish(),
  team1: teamEntrySchema.nullish(),
  team2: teamEntrySchema.nullish(),
  winner: intToNumberSchema.optional(),
  noOfSets: intToNumberSchema.optional(),
  t1: scoreFormSchema,
  t2: scoreFormSchema
})

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

export const h2hBaseSchema = object({
  player: object({
    id: string(),
    first_name: string(),
    last_name: string(),
    current_singles: intToNumberSchema,
    country: countrySchema
  }),
  h2h: array(
    object({
      opponent: object({
        id: string(),
        first_name: string(),
        last_name: string(),
        current_singles: intToNumberSchema,
        country: countrySchema
      }),
      wins: intToNumberSchema,
      matches: intToNumberSchema
    })
  )
})
export type H2HBaseType = z.infer<typeof h2hBaseSchema>

export const yearsSchema = object({
  tournaments: array(
    tournamentSchema.extend({
      type: string()
    })
  ),
  players: array(
    personSchema.extend({
      type: string()
    })
  )
})

export const resultsArchiveSchema = editionSchema.extend({
  events: array(
    eventSchema.extend({
      umpires: array(personSchema)
    })
  )
})
export type ResultsArchiveType = z.infer<typeof resultsArchiveSchema>

export const countryTitleSchema = playerSchema
  .pick({
    id: true,
    first_name: true,
    last_name: true,
    tour: true
  })
  .extend({
    edition: editionSchema
      .pick({
        id: true,
        category: true,
        tournament: true,
        year: true
      })
      .extend({
        type: MatchTypeEnum
      })
  })
export type CountryTitleType = z.infer<typeof countryTitleSchema>

export const h2hTeamSchema = object({
  titles: intToNumberSchema,
  wins: intToNumberSchema,
  losses: intToNumberSchema,
  tour_wins: intToNumberSchema,
  tour_losses: intToNumberSchema,
  tour_titles: intToNumberSchema,
  players: array(playerSchema)
})
export type H2HTeamType = z.infer<typeof h2hTeamSchema>

export const h2hMatchSchema = object({
  winning_team: literal(["t1", "t2"]).nullish(),
  round: RoundEnum,
  incomplete: IncompleteEnum.nullish(),
  stats: boolean(),
  surface: surfaceSchema.nullish(),
  year: intToNumberSchema,
  tournament: tournamentSchema,
  id: intToNumberSchema,
  match_no: intToNumberSchema,
  level: LevelEnum,
  sets: array(array(array(intToNumberSchema.nullable()))),
  tour: TourEnum.transform(val => tourEnum[val])
})
export type H2HMatchType = z.infer<typeof h2hMatchSchema>
