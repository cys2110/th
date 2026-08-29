import { z } from "zod"
import { type Database, type Tables } from "~/types/database.types"

export type TourEnum = Database["tennis"]["Enums"]["tour_enum"]
export type MatchTypeEnum = Database["tennis"]["Enums"]["match_type_enum"]
export type DrawEnum = Database["tennis"]["Enums"]["draw_enum"]
export type IncompleteEnum = Database["tennis"]["Enums"]["incomplete_enum"]

export const DrawEnumType = z.enum(["Main", "Qualifying"], `Draw must be one of ${["Main", "Qualifying"].join(", ")}`)

export const DRAW_TYPES = ["Elimination", "Round robin", "Country draw", "Laver Cup", "Davis Cup"] as const
export const DrawTypeEnum = z.enum(DRAW_TYPES, `Draw must be one of ${DRAW_TYPES.join(", ")}`)

export const LEVELS = ["Tour", "Challenger", "ITF"] as const
export const LevelEnum = z.enum(LEVELS, `Level must be one of ${LEVELS.join(", ")}`)

export const MATCH_TYPES = ["Singles", "Doubles"] as const
export const MatchTypeEnum = z.enum(MATCH_TYPES, `Match type must be one of ${MATCH_TYPES.join(", ")}`)

export const TOUR_OPTIONS = ["ATP", "WTA", "ITF-M", "ITF-W"] as const
export const TourEnum = z.enum(TOUR_OPTIONS, `Tour must be one of ${TOUR_OPTIONS.join(", ")}`)
