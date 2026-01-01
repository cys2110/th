

import { object, string } from "zod"
import { intToNumberSchema } from "./schemas"
import { IncompleteEnum } from "./enums"

export const scoreSchema = object({
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
