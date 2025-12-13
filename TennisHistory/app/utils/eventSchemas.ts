import { array, number, object, string, union, url, z } from "zod"

export const scrapeFormSchema = object({
  year: yearSchema.optional(),
  type: MatchTypeEnum,
  draw: DrawEnum.optional(),
  tid: number("Please enter a valid tournament ID")
    .int("Tournament ID must be a number")
    .positive("Tournament ID must be a positive number")
    .optional(),
  tid2: number("Please enter a valid site ID").int("Site ID must be a number").positive("Site ID must be a positive number").optional(),
  year2: yearSchema.optional(),
  draw_size: number("Please enter a valid draw size").int("Draw size must be a number").positive("Draw size must be a positive number").optional(),
  sets: string().optional(),
  eid: number().optional(),
  wid: number().optional(),
  draw_range: array(string().transform(s => parseInt(s, 10))).optional(),
  skip: array(string().transform(s => parseInt(s, 10))).optional(),
  links: array(string()).optional(),
  players: array(
    object({
      label: string(),
      value: union([string(), number()])
    }).transform(({ value }) => value)
  ).optional(),
  category: object({
    label: string(),
    value: union([string(), number()])
  })
    .transform(({ value }) => value)
    .optional()
})
export type ScrapeFormInput = z.input<typeof scrapeFormSchema>
export type ScrapeFormSchema = z.infer<typeof scrapeFormSchema>

export const eventFormSchema = object({
  id: string().optional(),
  edition: number().int().positive(),
  dates: dateRangeSchema.optional(),
  category: string("Please enter a valid category").optional(),
  currency: optionSchema.optional(),
  pm: number("Please enter a valid money amount").positive("Prize money must be a positive amount").optional(),
  tfc: number("Please enter a valid money amount").positive("Total financial commitment must be a positive amount").optional(),
  surface: string().optional(),
  tour: TourEnum.optional(),
  level: LevelEnum,
  sponsor_name: string("Please enter a valid sponsor name").optional(),
  site_link: url("Please enter a valid URL"),
  wiki_link: url("Please enter a valid URL").optional(),
  venues: array(optionSchema).optional(),
  supervisors: array(optionSchema).optional(),
  s_draw: string("Please enter a valid draw").optional(),
  d_draw: string("Please enter a valid draw").optional(),
  qs_draw: string("Please enter a valid draw").optional(),
  qd_draw: string("Please enter a valid draw").optional(),
  s_link: url("Please enter a valid URL").optional(),
  d_link: url("Please enter a valid URL").optional(),
  qs_link: url("Please enter a valid URL").optional(),
  qd_link: url("Please enter a valid URL").optional()
})
export type EventFormInput = z.input<typeof eventFormSchema>
export type EventFormSchema = z.infer<typeof eventFormSchema>

export const awardFormSchema = object({
  id: string().optional(),
  edition: number(),
  tour: TourEnum,
  round: RoundEnum,
  type: MatchTypeEnum,
  points: number("Please enter a valid points value").int("Please enter a valid points value").nonnegative("Points cannot be negative").optional(),
  pm: number("Please enter a valid prize money amount")
    .int("Please enter a valid prize money amount")
    .nonnegative("Prize money cannot be negative")
    .optional()
}).transform(data => {
  const round = data.round

  const roundMapping = {
    Win: 0,
    Final: 1,
    Semifinals: 2,
    Quarterfinals: 3,
    "Round of 16": 4,
    "Round of 32": 5,
    "Round of 64": 6,
    "Round of 128": 7,
    Qualifier: 8,
    "Qualifying round 3": 9,
    "Qualifying round 2": 10,
    "Qualifying round 1": 11
  }

  const draw = round ? (round.includes("Qualifying") || round === "Qualifier" ? "Qualifying" : "Main") : undefined

  return {
    ...data,
    event: `${data.edition}-${data.tour}`,
    id: data.id ?? `${data.edition}-${data.tour} ${data.type.charAt(0)} ${draw!.charAt(0)} ${roundEnum[data.round]}`,
    number: round ? roundMapping[round as keyof typeof roundMapping] : undefined,
    draw
  }
})
export type AwardFormInput = z.input<typeof awardFormSchema>
export type AwardFormSchema = z.infer<typeof awardFormSchema>

export const seedFormSchema = object({
  id: optionSchema,
  edition: number(),
  tour: TourEnum,
  type: MatchTypeEnum,
  draw: DrawEnum,
  seed: number().int("Please enter a valid seed number").positive("Please enter a valid seed number"),
  rank: number().int("Please enter a valid rank").nonnegative("Rank must be a non-negative integer").optional()
}).transform(data => ({
  ...data,
  event: `${data.edition}-${data.tour}`
}))
export type SeedFormInput = z.input<typeof seedFormSchema>
export type SeedFormSchema = z.infer<typeof seedFormSchema>

export const entryInfoFormSchema = object({
  id: optionSchema.optional(),
  edition: number(),
  relationship: string("Please select a relationship"),
  draw: DrawEnum,
  type: MatchTypeEnum,
  tour: TourEnum,
  rank: number().int("Please enter a valid rank").nonnegative("Rank cannot be a negative number").optional(),
  reason: string().optional(),
  teammate: string().optional(),
  players: array(optionSchema).optional()
}).transform(data => ({
  ...data,
  event: `${data.edition}-${data.tour}`
}))
export type EntryInfoFormInput = z.input<typeof entryInfoFormSchema>
export type EntryInfoFormSchema = z.infer<typeof entryInfoFormSchema>

export const entryFormSchema = object({
  id: string().optional(),
  edition: number(),
  tour: TourEnum,
  type: MatchTypeEnum,
  status: optionSchema.optional(),
  q_status: optionSchema.optional(),
  seed: number().int().positive().optional(),
  q_seed: number().int().positive().optional(),
  rank: number().int().nonnegative().optional(),
  rank2: number().int().nonnegative().optional(),
  points: number().int().nonnegative().optional(),
  pm: number().int().nonnegative().optional(),
  player1: optionSchema.optional(),
  player2: optionSchema.optional()
}).transform(data => ({
  ...data,
  event: `${data.edition}-${data.tour}`
}))
export type EntryFormInput = z.input<typeof entryFormSchema>
export type EntryFormSchema = z.infer<typeof entryFormSchema>
