import { array, number, object, string, union, url, z } from "zod"
import { CalendarDate } from "@internationalized/date"

export const scrapeFormSchema = object({
  category: object({
    label: string(),
    value: union([string(), number()])
  })
    .transform(({ value }) => value)
    .optional(),
  draw: DrawEnum.optional(),
  draw_range: array(string().transform(s => parseInt(s, 10))).optional(),
  draw_size: number("Please enter a valid draw size").int("Draw size must be a number").positive("Draw size must be a positive number").optional(),
  eid: number().optional(),
  links: array(string()).optional(),
  players: array(
    object({
      label: string(),
      value: union([string(), number()]),
      icon: string()
    }).transform(({ value }) => value)
  ).optional(),
  sets: string().optional(),
  skip: array(string().transform(s => parseInt(s, 10))).optional(),
  tid: number("Please enter a valid tournament ID")
    .int("Tournament ID must be a number")
    .positive("Tournament ID must be a positive number")
    .optional(),
  tid2: number("Please enter a valid site ID").int("Site ID must be a number").positive("Site ID must be a positive number").optional(),
  type: MatchTypeEnum,
  wid: number().optional(),
  year: yearSchema.optional(),
  year2: yearSchema.optional()
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
  tour: TourInputEnum.optional(),
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
  tour: TourInputEnum,
  round: RoundEnum,
  type: MatchTypeEnum,
  points: number("Please enter a valid points value").int("Please enter a valid points value").nonnegative("Points cannot be negative").optional(),
  pm: number("Please enter a valid prize money amount")
    .int("Please enter a valid prize money amount")
    .nonnegative("Prize money cannot be negative")
    .optional()
}).transform(data => {
  const { round, id, tour, type, edition, ...rest } = data

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
    "Qualifying round 1": 11,
    "Round robin": 4,
    "Group stage": 4,
    Participation: 5,
    Alternate: 6,
    "Day 1": 3,
    "Day 2": 2,
    "Day 3": 1
  }

  const draw = round ? (round.includes("Qualifying") || round === "Qualifier" ? "Qualifying" : "Main") : undefined

  return {
    ...rest,
    tour,
    type,
    event: `${edition}-${tour}`,
    edition,
    id: data.id ?? `${edition}-${tour} ${type.charAt(0)} ${draw!.charAt(0)} ${roundEnum[round]}`,
    draw,
    number: round ? roundMapping[round as keyof typeof roundMapping] : undefined
  }
})

export type AwardFormInput = z.input<typeof awardFormSchema>
export type AwardFormSchema = z.infer<typeof awardFormSchema>

export const seedFormSchema = object({
  id: optionSchema,
  edition: number(),
  tour: TourInputEnum,
  type: MatchTypeEnum,
  draw: DrawEnum,
  seed: number().int("Please enter a valid seed number").positive("Please enter a valid seed number"),
  rank: number().int("Please enter a valid rank").nonnegative("Rank must be a non-negative integer").optional()
})

export type SeedFormSchema = z.infer<typeof seedFormSchema>

export const entryInfoFormSchema = object({
  id: optionSchema.optional(),
  edition: number(),
  relationship: string("Please select a relationship"),
  draw: DrawEnum,
  type: MatchTypeEnum,
  tour: TourInputEnum,
  rank: number().int("Please enter a valid rank").nonnegative("Rank cannot be a negative number").optional(),
  reason: string().optional(),
  teammate: string().optional(),
  players: array(optionSchema).optional()
})

export type EntryInfoFormSchema = z.infer<typeof entryInfoFormSchema>

export const entryFormSchema = object({
  id: string().optional(),
  tournament: string(),
  edition: number(),
  tour: TourInputEnum.optional(),
  type: MatchTypeEnum.optional(),
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
})

export type EntryFormSchema = z.infer<typeof entryFormSchema>

export const countryEntryFormSchema = object({
  edition: number(),
  country: optionSchema,
  seed: number().optional()
})

export type CountryEntryFormSchema = z.infer<typeof countryEntryFormSchema>

export const tieFormSchema = object({
  event: string(),
  round: string(),
  country1: optionSchema,
  country2: optionSchema,
  date: z.instanceof(CalendarDate).optional(),
  venue: optionSchema.optional()
})

export type TieFormSchema = z.infer<typeof tieFormSchema>
