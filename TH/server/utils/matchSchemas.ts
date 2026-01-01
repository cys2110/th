

import { Duration } from "neo4j-driver"
import { literal, object, string } from "zod"
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
