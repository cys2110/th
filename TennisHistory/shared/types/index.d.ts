import type { Enums, Tables, TablesInsert, TablesUpdate } from "~/types/database.types"

declare global {
  type TourEnum = Enums<{ schema: "tennis" }, "tour_enum">
  type DrawEnum = Enums<{ schema: "tennis" }, "draw_enum">
  type MatchTypeEnum = Enums<{ schema: "tennis" }, "match_type_enum">
  type LevelEnum = Enums<{ schema: "tennis" }, "level_enum">
  type IncompleteEnum = Enums<{ schema: "tennis" }, "incomplete_enum">
  type StatusEnum = Enums<{ schema: "tennis" }, "status_enum">
  type SurfaceEnum = Enums<{ schema: "tennis" }, "surface_enum">
  type EnvironmentEnum = Enums<{ schema: "tennis" }, "environment_enum">
  type DrawTypeEnum = Enums<{ schema: "tennis" }, "draw_type_enum">

  type CountryType = Tables<{ schema: "tennis" }, "country">
  type CountryUpdate = TablesUpdate<{ schema: "tennis" }, "country">

  type VenueUpdate = Tables<{ schema: "tennis" }, "venue">

  type Player = Tables<{ schema: "tennis" }, "player">

  type RankingsInsert = TablesInsert<{ schema: "tennis" }, "rankings">

  type TournamentType = Tables<{ schema: "tennis" }, "tournament">
  type EditionType = Tables<{ schema: "tennis" }, "editions">

  type RoundType = Tables<{ schema: "tennis" }, "rounds">

  type TeamEntry = Tables<{ schema: "tennis" }, "entries_by_team">

  type EntryInfo = Tables<{ schema: "tennis" }, "entry_info">

  type EntryInsert = TablesInsert<{ schema: "tennis" }, "entries">
  type PemInsert = TablesInsert<{ schema: "tennis" }, "player_entry_mapping">
  type SeedInsert = TablesInsert<{ schema: "tennis" }, "seeds">
  type EntryStatusInsert = TablesInsert<{ schema: "tennis" }, "entry_status">

  type MatchInsert = TablesInsert<{ schema: "tennis" }, "matches">

  type MatchScore = Tables<{ schema: "tennis" }, "match_scores">
  type ScoreInsert = TablesInsert<{ schema: "tennis" }, "match_scores">
  type StatsInsert = TablesInsert<{ schema: "tennis" }, "match_stats">
}

export {}
