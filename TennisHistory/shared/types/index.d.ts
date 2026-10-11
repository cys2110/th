import type { Database } from "~/types/database.types"

declare global {
  type TourEnum = Database["tennis"]["Enums"]["tour_enum"]
  type DrawEnum = Database["tennis"]["Enums"]["draw_enum"]
  type MatchTypeEnum = Database["tennis"]["Enums"]["match_type_enum"]
  type LevelEnum = Database["tennis"]["Enums"]["level_enum"]
  type IncompleteEnum = Database["tennis"]["Enums"]["incomplete_enum"]
  type StatusEnum = Database["tennis"]["Enums"]["status_enum"]

  type PlayerStatsInsert = Database["tennis"]["Tables"]["player_stats"]["Insert"]

  type EntryInsert = Database["tennis"]["Tables"]["entries"]["Insert"]
  type PemInsert = Database["tennis"]["Tables"]["player_entry_mapping"]["Insert"]
  type SeedInsert = Database["tennis"]["Tables"]["seeds"]["Insert"]
  type EntryStatusInsert = Database["tennis"]["Tables"]["entry_status"]["Insert"]

  type MatchInsert = Database["tennis"]["Tables"]["matches"]["Insert"]
  type ScoreInsert = Database["tennis"]["Tables"]["match_scores"]["Insert"]
  type StatsInsert = Database["tennis"]["Tables"]["match_stats"]["Insert"]
}

export {}
