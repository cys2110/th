/**
 * @module shared/types/enums
 * @description Enums shared across client and server side
 * References no other files to avoid circular dependencies
 */

import { string, union, z } from "zod"

/** @constant */
export const tourEnum = {
  ATP: "ATP",
  WTA: "WTA",
  Men: "ITF-M",
  Women: "ITF-W",
  "ITF-M": "Men",
  "ITF-W": "Women"
} as const

/** @enum */
export const TourInputEnum = z.enum(["ATP", "WTA", "Men", "Women"], "Please select a valid tour")
export type TourInputEnumType = z.infer<typeof TourInputEnum>

/** @function tourEnumTransform - Transforms a string to a valid tour */
export const tourEnumTransform = union([TourInputEnum, string()]).transform(val => tourEnum[val as keyof typeof tourEnum])

/** @enum */
export const MatchTypeEnum = z.enum(["Singles", "Doubles"], "Please select a valid match type")
export type MatchTypeEnumType = z.infer<typeof MatchTypeEnum>

/** @enum */
export const RoundEnum = z.enum([
  "Win",
  "Final",
  "Semifinals",
  "Quarterfinals",
  "Round of 16",
  "Round of 32",
  "Round of 64",
  "Round of 128",
  "Qualifier",
  "Qualifying round 3",
  "Qualifying round 2",
  "Qualifying round 1",
  "Round robin",
  "Participation",
  "Alternate",
  "Day 1",
  "Day 2",
  "Day 3"
])
export type RoundEnumType = z.infer<typeof RoundEnum>

/** @enum */
export const EnvironmentEnum = z.enum(["Indoor", "Outdoor"], "Please select a valid environment")
export type EnvironmentEnumType = z.infer<typeof EnvironmentEnum>

/** @enum */
export const SurfaceEnum = z.enum(["Clay", "Grass", "Hard", "Carpet"], "Please select a valid surface")
