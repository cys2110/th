import { array, boolean, literal, object, string, z } from "zod"
import {
  DrawEnum,
  durationToStringSchema,
  IncompleteEnum,
  intToNumberSchema,
  MatchTypeEnum,
  neoDateToStringSchema,
  personSchema,
  RoundEnum,
  surfaceSchema
} from "./schemas"
import { teamEntrySchema } from "./eventSchemas"
import { percentage } from "../utils/helpers"

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
