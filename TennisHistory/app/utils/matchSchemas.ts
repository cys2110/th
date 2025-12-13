import { literal, number, object, string, stringFormat, union, z } from "zod"
import { CalendarDate } from "@internationalized/date"

const scoreFormSchema = object({
  id: string().optional(),
  s1: number().int().nonnegative().optional(),
  s2: number().int().nonnegative().optional(),
  s3: number().int().nonnegative().optional(),
  s4: number().int().nonnegative().optional(),
  s5: number().int().nonnegative().optional(),
  t1: number().int().nonnegative().optional(),
  t2: number().int().nonnegative().optional(),
  t3: number().int().nonnegative().optional(),
  t4: number().int().nonnegative().optional(),
  t5: number().int().nonnegative().optional(),
  incomplete: IncompleteEnum.optional(),
  aces: number().int().nonnegative().optional(),
  dfs: number().int().nonnegative().optional(),
  serve1_w: number().int().nonnegative().optional(),
  serve1: number().int().nonnegative().optional(),
  serve2_w: number().int().nonnegative().optional(),
  serve2: number().int().nonnegative().optional(),
  ret1_w: number().int().nonnegative().optional(),
  ret1: number().int().nonnegative().optional(),
  ret2_w: number().int().nonnegative().optional(),
  ret2: number().int().nonnegative().optional(),
  bps_saved: number().int().nonnegative().optional(),
  bps_faced: number().int().nonnegative().optional(),
  bps_converted: number().int().nonnegative().optional(),
  bp_opps: number().int().nonnegative().optional(),
  net_w: number().int().nonnegative().optional(),
  net: number().int().nonnegative().optional(),
  winners: number().int().nonnegative().optional(),
  ues: number().int().nonnegative().optional(),
  max_speed: number().int().nonnegative().optional(),
  avg1_speed: number().int().nonnegative().optional(),
  avg2_speed: number().int().nonnegative().optional(),
  serve_games: number().int().nonnegative().optional(),
  return_games: number().int().nonnegative().optional()
})

export const matchFormSchema = object({
  id: string().optional(),
  edition: number(),
  type: MatchTypeEnum,
  draw: DrawEnum,
  tour: TourEnum,
  round: RoundEnum,
  match_no: number("Please enter a match number").int("Please enter a valid match number").positive("Please enter a valid match number"),
  incomplete: IncompleteEnum.optional(),
  court: string().optional(),
  date: z.instanceof(CalendarDate).optional(),
  duration: union([
    stringFormat("duration", /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, "Please enter duration in format HH:MM:SS"),
    stringFormat("duration", /^[0-5]\d:[0-5]\d$/, "Please enter duration in format MM:SS")
  ]).optional(),
  group: string().optional(),
  umpire: optionSchema.optional(),
  t1: optionSchema.optional(),
  t2: optionSchema.optional(),
  winner: literal(["t1", "t2"]).optional(),
  noOfSets: literal(["Best Of 3", "Best Of 5"]).optional(),
  team1: scoreFormSchema,
  team2: scoreFormSchema
}).transform(data => ({
  ...data,
  event: `${data.edition}-${data.tour}`
}))
export type MatchFormInput = z.input<typeof matchFormSchema>
export type MatchFormSchema = z.infer<typeof matchFormSchema>
