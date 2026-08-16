import { z } from "zod"

export const DRAW_TYPES = ["Elimination", "Round robin", "Country draw", "Laver Cup", "Davis Cup"] as const
export const DrawTypeEnum = z.enum(DRAW_TYPES, `Draw must be one of ${DRAW_TYPES.join(", ")}`)

export const TOUR_OPTIONS = ["ATP", "WTA", "ITF-M", "ITF-W"] as const
export const TourEnum = z.enum(TOUR_OPTIONS, `Tour must be one of ${TOUR_OPTIONS.join(", ")}`)
