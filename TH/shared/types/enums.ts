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
