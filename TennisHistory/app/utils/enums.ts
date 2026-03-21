import { z } from "zod"

export const CategoryEnum = z.enum(CATEGORIES)

export type CategoryType = z.infer<typeof CategoryEnum>

export const ContinentEnum = z.enum(CONTINENTS)

export type ContinentType = z.infer<typeof ContinentEnum>

export const CurrencyEnum = z.enum(CURRENCIES)

export type CurrencyType = z.infer<typeof CurrencyEnum>

export const DrawEnum = z.enum(DRAW_TYPES)

export type DrawType = z.infer<typeof DrawEnum>

export const DrawsEnum = z.enum(DRAWS)

export type DrawsType = z.infer<typeof DrawsEnum>

export const IncompleteEnum = z.enum(INCOMPLETE_OPTIONS)

export type IncompleteType = z.infer<typeof IncompleteEnum>

export const LevelEnum = z.enum(LEVELS)

export type LevelType = z.infer<typeof LevelEnum>

export const MatchTypeEnum = z.enum(MATCH_TYPES)

export type MatchEnumType = z.infer<typeof MatchTypeEnum>

export const RoundEnum = z.enum(ROUNDS)

export type RoundType = z.infer<typeof RoundEnum>

export const StatusEnum = z.enum(STATUSES)

export type StatusType = z.infer<typeof StatusEnum>

export const TourEnum = z.enum(TOUR_OPTIONS)

export type TourType = z.infer<typeof TourEnum>
