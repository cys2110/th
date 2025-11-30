// app/utils/schemas.ts
import { array, literal, number, object, string, stringFormat, union, url, z } from "zod"
import { CalendarDate } from "@internationalized/date"

export const dateRangeSchema = object({
  start: z.instanceof(CalendarDate).optional(),
  end: z.instanceof(CalendarDate).optional()
})

export const optionSchema = object({
  label: string(),
  value: union([string(), number()])
})
export type OptionInput = z.input<typeof optionSchema>

export const tournamentFormSchema = object({
  id: number("Please enter a tournament ID"),
  name: string("Please enter a tournament name"),
  tours: array(TourEnum, "Please select at least one tour"),
  established: yearSchema.optional(),
  abolished: yearSchema.optional(),
  website: url("Please enter a valid url").optional()
})
export type TournamentFormInput = z.input<typeof tournamentFormSchema>
export type TournamentFormSchema = z.infer<typeof tournamentFormSchema>

export const venueFormSchema = z
  .object({
    id: string().optional(),
    name: string().optional(),
    city: string("Please enter a city"),
    country: optionSchema.refine(val => val, {
      message: "Please select a country"
    })
  })
  .transform(data => {
    let id = data.id

    if (!id) {
      if (data.name) {
        id = data.name.includes(data.city) ? data.name : `${data.name}, ${data.city}`
      } else {
        id = data.city
      }
    }

    return {
      ...data,
      id
    }
  })
export type VenueFormInput = z.input<typeof venueFormSchema>
export type VenueFormSchema = z.infer<typeof venueFormSchema>

export const editionFormSchema = object({
  id: number("Please enter an edition ID").int("Please enter a valid edition ID").positive("Please enter a valid edition ID"),
  tournament: number(),
  tours: array(TourEnum, "Please select at least one tour"),
  surface: string().optional(),
  year: yearSchema,
  venues: array(optionSchema).optional(),
  currency: optionSchema.optional(),
  tfc: number("Please enter a valid money amount").positive("Total financial commitment must be a positive amount").optional(),
  wiki_link: url("Please enter a valid URL").optional(),
  draw_type: string().optional(),
  draw_link: url("Please enter a valid URL").optional(),
  sponsor_name: string("Please enter a valid sponsor name").optional(),
  category: string("Please enter a valid category").optional(),
  dates: dateRangeSchema.optional()
})
export type EditionFormInput = z.input<typeof editionFormSchema>
export type EditionFormSchema = z.infer<typeof editionFormSchema>

export const eventFormSchema = object({
  id: string().optional(),
  edition: number().int().positive(),
  dates: dateRangeSchema.optional(),
  category: string("Please enter a valid category").optional(),
  currency: optionSchema.optional(),
  pm: number("Please enter a valid money amount").positive("Prize money must be a positive amount").optional(),
  tfc: number("Please enter a valid money amount").positive("Total financial commitment must be a positive amount").optional(),
  surface: string().optional(),
  tour: TourEnum,
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

export const personFormSchema = object({
  id: string().optional(),
  first_name: string("Please enter a first name"),
  last_name: string("Please enter a last name"),
  type: literal(["Supervisor", "Coach", "Umpire"])
}).transform(data => {
  return {
    ...data,
    id: data.id ?? `${data.first_name} ${data.last_name}`.trim()
  }
})
export type PersonFormSchema = z.infer<typeof personFormSchema>

export const awardFormSchema = object({
  id: string().optional(),
  event: string("Please enter an ID").optional(),
  tour: TourEnum.optional(),
  round: RoundEnum.optional(),
  type: MatchTypeEnum.optional(),
  draw: DrawEnum.optional(),
  number: number("Please enter a valid number").int("Please enter a valid number").nonnegative("Please enter a valid number").optional(),
  points: number("Please enter a valid points value").int("Please enter a valid points value").nonnegative("Points cannot be negative").optional(),
  pm: number("Please enter a valid prize money amount")
    .int("Please enter a valid prize money amount")
    .nonnegative("Prize money cannot be negative")
    .optional()
}).transform(data => {
  return {
    ...data,
    id: data.id ?? `${data.event} ${data.type?.charAt(0)} ${data.draw?.charAt(0)} ${roundEnum[data.round!]}`
  }
})
export type AwardFormInput = z.input<typeof awardFormSchema>
export type AwardFormSchema = z.infer<typeof awardFormSchema>

export const seedFormSchema = object({
  id: optionSchema,
  event: string().nullish(),
  type: MatchTypeEnum.nullish(),
  draw: DrawEnum.nullish(),
  seed: number().int("Please enter a valid seed number").positive("Please enter a valid seed number").nullish(),
  rank: number().int("Please enter a valid rank").nonnegative("Rank must be a non-negative integer").nullish()
})
export type SeedFormInput = z.input<typeof seedFormSchema>
export type SeedFormSchema = z.infer<typeof seedFormSchema>

export const entryInfoFormSchema = object({
  id: optionSchema.optional(),
  event: string().nullish(),
  relationship: string("Please select a relationship"),
  draw: DrawEnum,
  type: MatchTypeEnum,
  rank: number().int("Please enter a valid rank").nonnegative("Rank cannot be a negative number").nullish(),
  reason: string().nullish(),
  teammate: string().nullish(),
  players: array(optionSchema).nullish()
})
export type EntryInfoFormInput = z.input<typeof entryInfoFormSchema>
export type EntryInfoFormSchema = z.infer<typeof entryInfoFormSchema>

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

export const entryFormSchema = object({
  id: string().optional(),
  event: string().nullish(),
  type: MatchTypeEnum,
  status: optionSchema.nullish(),
  q_status: optionSchema.nullish(),
  seed: number().int().positive().nullish(),
  q_seed: number().int().positive().nullish(),
  rank: number().int().nonnegative().nullish(),
  rank2: number().int().nonnegative().nullish(),
  points: number().int().nonnegative().nullish(),
  pm: number().int().nonnegative().nullish(),
  player1: optionSchema.nullish(),
  player2: optionSchema.nullish()
})
export type EntryFormInput = z.input<typeof entryFormSchema>
export type EntryFormSchema = z.infer<typeof entryFormSchema>

export const countryFormSchema = object({
  name: optionSchema,
  start_date: z.instanceof(CalendarDate).optional()
})

export const formerCountryFormSchema = object({
  name: optionSchema,
  dates: object({
    start: z.instanceof(CalendarDate).optional(),
    end: z.instanceof(CalendarDate).optional()
  })
})

export const coachFormSchema = object({
  name: optionSchema,
  years: string().optional()
})

export const playerFormSchema = object({
  id: string(),
  country: countryFormSchema,
  former_countries: array(formerCountryFormSchema).optional(),
  coaches: array(coachFormSchema).optional(),
  former_coaches: array(coachFormSchema).optional(),
  first_name: string("Please enter a first name"),
  last_name: string("Please enter a last name"),
  official_link: url("Please enter a valid URL").optional(),
  wiki_link: url("Please enter a valid URL").optional(),
  dob: z.instanceof(CalendarDate).optional(),
  dod: z.instanceof(CalendarDate).optional(),
  height: number("Please enter a valid height in cm").positive("Height must be a positive number").optional(),
  rh: literal(["Right", "Left"]).optional(),
  bh: literal(["One", "Two"]).optional(),
  turned_pro: yearSchema.optional(),
  retired: yearSchema.optional(),
  hof: yearSchema.optional()
})
export type PlayerFormInput = z.input<typeof playerFormSchema>
export type PlayerFormSchema = z.infer<typeof playerFormSchema>

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
  event: string(),
  type: MatchTypeEnum,
  draw: DrawEnum,
  round: RoundEnum,
  match_no: number("Please enter a match number").int("Please enter a valid match number").positive("Please enter a valid match number"),
  incomplete: IncompleteEnum.optional(),
  court: string().optional(),
  date: z.instanceof(CalendarDate).optional(),
  duration: stringFormat("duration", /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, "Please enter duration in format HH:MM:SS").optional(),
  group: string().optional(),
  umpire: optionSchema.optional(),
  team1: optionSchema.optional(),
  team2: optionSchema.optional(),
  winner: literal([1, 2]).optional(),
  noOfSets: literal(["BestOf3", "BestOf5"]).optional(),
  t1: scoreFormSchema,
  t2: scoreFormSchema
})
export type MatchFormInput = z.input<typeof matchFormSchema>
export type MatchFormSchema = z.infer<typeof matchFormSchema>
