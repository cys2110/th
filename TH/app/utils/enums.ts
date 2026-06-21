import { z } from "zod"

export const ContinentEnum = z.enum(CONTINENTS, `Continent must be one of ${CONTINENTS.join(", ")}`)

export type ContinentType = z.infer<typeof ContinentEnum>

export const CurrencyEnum = z.enum(CURRENCIES, `Currency must be one of ${CURRENCIES.join(", ")}`)

export type CurrencyType = z.infer<typeof CurrencyEnum>

export const DrawsEnum = z.enum(DRAWS, `Draw must be one of ${DRAWS.join(", ")}`)

export type DrawsType = z.infer<typeof DrawsEnum>

export const LevelEnum = z.enum(LEVELS, `Level must be one of ${LEVELS.join(", ")}`)

export type LevelType = z.infer<typeof LevelEnum>

export const MatchTypeEnum = z.enum(MATCH_TYPES, `Match type must be one of ${MATCH_TYPES.join(", ")}`)

export type MatchEnumType = z.infer<typeof MatchTypeEnum>

export const RoundEnum = z.enum(ROUNDS)

export type RoundType = z.infer<typeof RoundEnum>

export const StatusEnum = z.enum(STATUSES, `Status must be one of ${STATUSES.join(", ")}`)

export type StatusType = z.infer<typeof StatusEnum>

export const TourEnum = z.enum(TOUR_OPTIONS, `Tour must be one of ${TOUR_OPTIONS.join(", ")}`)

export type TourType = z.infer<typeof TourEnum>
