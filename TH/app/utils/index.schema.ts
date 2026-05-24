import { boolean, number, object, string, z } from "zod"

export const MatchScoreSchema = object({
  set_no: number().gte(1).lte(5),
  t1: number().optional(),
  t2: number().optional(),
  tb: number().optional(),
  super_tb: boolean().default(false)
})
export type MatchScoreType = z.infer<typeof MatchScoreSchema>

export const MatchStatSchema = object({
  entry_id: string(),
  serve1_w: number().optional(),
  serve1: number().optional(),
  serve2_w: number().optional(),
  serve2: number().optional(),
  ret1_w: number().optional(),
  ret1: number().optional(),
  ret2_w: number().optional(),
  ret2: number().optional(),
  winners: number().optional(),
  ues: number().optional(),
  bps_converted: number().optional(),
  bp_opps: number().optional(),
  bps_saved: number().optional(),
  bps_faced: number().optional(),
  net_w: number().optional(),
  net: number().optional(),
  aces: number().optional(),
  dfs: number().optional(),
  serve_games: number().optional(),
  return_games: number().optional(),
  avg1_speed: number().optional(),
  avg2_speed: number().optional(),
  max_speed: number().optional()
})

export type MatchStatType = z.infer<typeof MatchStatSchema>
