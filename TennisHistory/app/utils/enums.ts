import { z } from "zod"

export const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"] as const
export const ContinentEnum = z.enum(CONTINENTS, `Continent must be one of ${CONTINENTS.join(", ")}`)

export const DrawEnumType = z.enum(["Main", "Qualifying"], `Draw must be one of ${["Main", "Qualifying"].join(", ")}`)

export const DRAW_TYPES = ["Elimination", "Round robin", "Country draw", "Laver Cup", "ITF country", "Davis Cup"] as const
export const DrawTypeEnum = z.enum(DRAW_TYPES, `Draw must be one of ${DRAW_TYPES.join(", ")}`)

export const LEVELS = ["Tour", "Challenger", "ITF"] as const
export const LevelEnum = z.enum(LEVELS, `Level must be one of ${LEVELS.join(", ")}`)

export const MATCH_TYPES = ["Singles", "Doubles"] as const
export const MatchTypeEnum = z.enum(MATCH_TYPES, `Match type must be one of ${MATCH_TYPES.join(", ")}`)

export const STATUS_TYPES = ["AL", "CO", "JR", "LL", "NG", "Q", "PR", "SE", "WC"] as const
export const StatusEnumType = z.enum(STATUS_TYPES, `Status must be one of ${STATUS_TYPES.join(", ")}`)

export const TOUR_OPTIONS = ["ATP", "WTA", "ITF-M", "ITF-W"] as const
export const TourEnum = z.enum(TOUR_OPTIONS, `Tour must be one of ${TOUR_OPTIONS.join(", ")}`)
