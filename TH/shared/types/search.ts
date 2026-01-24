import { union, z } from "zod"

export const searchResultsSchema = union([playerSearchSchema, baseTournamentSchema])

export type SearchResultsType = z.infer<typeof searchResultsSchema>
