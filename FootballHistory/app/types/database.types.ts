export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  football: {
    Tables: {
      competition: {
        Row: {
          category: Database["football"]["Enums"]["competition_category"]
          code: string
          confederation_id: string | null
          division_level: number | null
          emblem_url: string | null
          federation_id: string | null
          fifa_governed: boolean
          id: string
          name: string
          promotion_id: string | null
          relegation_id: string | null
          type: Database["football"]["Enums"]["competition_type"]
        }
        Insert: {
          category: Database["football"]["Enums"]["competition_category"]
          code: string
          confederation_id?: string | null
          division_level?: number | null
          emblem_url?: string | null
          federation_id?: string | null
          fifa_governed?: boolean
          id?: string
          name: string
          promotion_id?: string | null
          relegation_id?: string | null
          type: Database["football"]["Enums"]["competition_type"]
        }
        Update: {
          category?: Database["football"]["Enums"]["competition_category"]
          code?: string
          confederation_id?: string | null
          division_level?: number | null
          emblem_url?: string | null
          federation_id?: string | null
          fifa_governed?: boolean
          id?: string
          name?: string
          promotion_id?: string | null
          relegation_id?: string | null
          type?: Database["football"]["Enums"]["competition_type"]
        }
        Relationships: [
          {
            foreignKeyName: "competition_confederation_id_fkey"
            columns: ["confederation_id"]
            isOneToOne: false
            referencedRelation: "confederation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_federation_id_fkey"
            columns: ["federation_id"]
            isOneToOne: false
            referencedRelation: "federation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "competition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_relegation_id_fkey"
            columns: ["relegation_id"]
            isOneToOne: false
            referencedRelation: "competition"
            referencedColumns: ["id"]
          },
        ]
      }
      confederation: {
        Row: {
          continent: string
          founded: number
          id: string
          logo_url: string | null
          name: string
          website: string | null
        }
        Insert: {
          continent: string
          founded: number
          id: string
          logo_url?: string | null
          name: string
          website?: string | null
        }
        Update: {
          continent?: string
          founded?: number
          id?: string
          logo_url?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      country: {
        Row: {
          continent: Database["public"]["Enums"]["continent_enum"]
          icon: string
          id: string
          name: string
        }
        Insert: {
          continent: Database["public"]["Enums"]["continent_enum"]
          icon: string
          id: string
          name: string
        }
        Update: {
          continent?: Database["public"]["Enums"]["continent_enum"]
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      federation: {
        Row: {
          confederation_id: string
          country_id: string
          fifa_member: boolean
          founded: number | null
          headquarters: string
          id: string
          logo_url: string | null
          name: string
          short_name: string
          website: string | null
        }
        Insert: {
          confederation_id: string
          country_id: string
          fifa_member?: boolean
          founded?: number | null
          headquarters: string
          id?: string
          logo_url?: string | null
          name: string
          short_name: string
          website?: string | null
        }
        Update: {
          confederation_id?: string
          country_id?: string
          fifa_member?: boolean
          founded?: number | null
          headquarters?: string
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "federation_confederation_id_fkey"
            columns: ["confederation_id"]
            isOneToOne: false
            referencedRelation: "confederation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federation_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
        ]
      }
      group: {
        Row: {
          id: string
          name: string
          round_id: string
          season_id: string
        }
        Insert: {
          id?: string
          name: string
          round_id: string
          season_id: string
        }
        Update: {
          id?: string
          name?: string
          round_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
        ]
      }
      group_team: {
        Row: {
          group_id: string
          id: string
          team_id: string
        }
        Insert: {
          group_id: string
          id?: string
          team_id: string
        }
        Update: {
          group_id?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_team_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_team_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      match: {
        Row: {
          away_penalties: number | null
          away_score: number | null
          away_team_id: string
          decision: Database["football"]["Enums"]["match_decision"]
          group_id: string | null
          home_penalties: number | null
          home_score: number | null
          home_team_id: string
          id: string
          kickoff_time: string | null
          match_no: number
          round_id: string | null
          season_id: string
          status: Database["football"]["Enums"]["match_status"]
          venue_id: string | null
          winning_team_id: string | null
        }
        Insert: {
          away_penalties?: number | null
          away_score?: number | null
          away_team_id: string
          decision?: Database["football"]["Enums"]["match_decision"]
          group_id?: string | null
          home_penalties?: number | null
          home_score?: number | null
          home_team_id: string
          id?: string
          kickoff_time?: string | null
          match_no: number
          round_id?: string | null
          season_id: string
          status?: Database["football"]["Enums"]["match_status"]
          venue_id?: string | null
          winning_team_id?: string | null
        }
        Update: {
          away_penalties?: number | null
          away_score?: number | null
          away_team_id?: string
          decision?: Database["football"]["Enums"]["match_decision"]
          group_id?: string | null
          home_penalties?: number | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          kickoff_time?: string | null
          match_no?: number
          round_id?: string | null
          season_id?: string
          status?: Database["football"]["Enums"]["match_status"]
          venue_id?: string | null
          winning_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_winning_team_id_fkey"
            columns: ["winning_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      match_award: {
        Row: {
          award_level: number | null
          award_type: string
          id: string
          is_shared: boolean
          match_id: string
          player_id: string | null
          team_id: string | null
        }
        Insert: {
          award_level?: number | null
          award_type: string
          id?: string
          is_shared?: boolean
          match_id: string
          player_id?: string | null
          team_id?: string | null
        }
        Update: {
          award_level?: number | null
          award_type?: string
          id?: string
          is_shared?: boolean
          match_id?: string
          player_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_award_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_award_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_award_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      match_event: {
        Row: {
          goal_execution: Database["football"]["Enums"]["goal_execution"] | null
          goal_situation: Database["football"]["Enums"]["goal_situation"] | null
          id: string
          match_id: string
          minute: number
          stoppage_minute: number | null
          team_id: string | null
          type: Database["football"]["Enums"]["match_event_type"]
        }
        Insert: {
          goal_execution?:
            | Database["football"]["Enums"]["goal_execution"]
            | null
          goal_situation?:
            | Database["football"]["Enums"]["goal_situation"]
            | null
          id?: string
          match_id: string
          minute: number
          stoppage_minute?: number | null
          team_id?: string | null
          type: Database["football"]["Enums"]["match_event_type"]
        }
        Update: {
          goal_execution?:
            | Database["football"]["Enums"]["goal_execution"]
            | null
          goal_situation?:
            | Database["football"]["Enums"]["goal_situation"]
            | null
          id?: string
          match_id?: string
          minute?: number
          stoppage_minute?: number | null
          team_id?: string | null
          type?: Database["football"]["Enums"]["match_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "match_event_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_event_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_event_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      match_event_player: {
        Row: {
          id: string
          match_event_id: string
          player_id: string
          role: Database["football"]["Enums"]["match_event_role"]
        }
        Insert: {
          id?: string
          match_event_id: string
          player_id: string
          role: Database["football"]["Enums"]["match_event_role"]
        }
        Update: {
          id?: string
          match_event_id?: string
          player_id?: string
          role?: Database["football"]["Enums"]["match_event_role"]
        }
        Relationships: [
          {
            foreignKeyName: "match_event_player_match_event_id_fkey"
            columns: ["match_event_id"]
            isOneToOne: false
            referencedRelation: "match_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_event_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_event_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_event_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_event_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_event_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineup: {
        Row: {
          captain: boolean
          id: string
          match_id: string
          player_id: string
          position: string | null
          shirt_number: number | null
          starter: boolean
          team_id: string
        }
        Insert: {
          captain?: boolean
          id?: string
          match_id: string
          player_id: string
          position?: string | null
          shirt_number?: number | null
          starter?: boolean
          team_id: string
        }
        Update: {
          captain?: boolean
          id?: string
          match_id?: string
          player_id?: string
          position?: string | null
          shirt_number?: number | null
          starter?: boolean
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_lineup_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_lineup_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      match_referee: {
        Row: {
          id: string
          match_id: string
          person_id: string
          type: Database["football"]["Enums"]["referee_type"]
        }
        Insert: {
          id?: string
          match_id: string
          person_id: string
          type: Database["football"]["Enums"]["referee_type"]
        }
        Update: {
          id?: string
          match_id?: string
          person_id?: string
          type?: Database["football"]["Enums"]["referee_type"]
        }
        Relationships: [
          {
            foreignKeyName: "match_referee_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_referee_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_referee_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_referee_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["person_id"]
          },
        ]
      }
      match_stats: {
        Row: {
          corners: number | null
          fouls: number | null
          id: string
          match_id: string
          offsides: number | null
          possession: number | null
          red_cards: number | null
          shots: number | null
          shots_on_target: number | null
          team_id: string
          yellow_cards: number | null
        }
        Insert: {
          corners?: number | null
          fouls?: number | null
          id?: string
          match_id: string
          offsides?: number | null
          possession?: number | null
          red_cards?: number | null
          shots?: number | null
          shots_on_target?: number | null
          team_id: string
          yellow_cards?: number | null
        }
        Update: {
          corners?: number | null
          fouls?: number | null
          id?: string
          match_id?: string
          offsides?: number | null
          possession?: number | null
          red_cards?: number | null
          shots?: number | null
          shots_on_target?: number | null
          team_id?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_shootout_attempt: {
        Row: {
          attempt_number: number
          goalkeeper_id: string | null
          id: string
          is_sudden_death: boolean
          match_id: string
          outcome: string
          player_id: string | null
          team_attempt_number: number | null
          team_id: string
        }
        Insert: {
          attempt_number: number
          goalkeeper_id?: string | null
          id?: string
          is_sudden_death?: boolean
          match_id: string
          outcome: string
          player_id?: string | null
          team_attempt_number?: number | null
          team_id: string
        }
        Update: {
          attempt_number?: number
          goalkeeper_id?: string | null
          id?: string
          is_sudden_death?: boolean
          match_id?: string
          outcome?: string
          player_id?: string | null
          team_attempt_number?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalty_shootout_attempt_goalkeeper_id_fkey"
            columns: ["goalkeeper_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_goalkeeper_id_fkey"
            columns: ["goalkeeper_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_goalkeeper_id_fkey"
            columns: ["goalkeeper_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_goalkeeper_id_fkey"
            columns: ["goalkeeper_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_goalkeeper_id_fkey"
            columns: ["goalkeeper_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempt_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          birth_country_id: string | null
          birth_place: string | null
          dob: string | null
          dod: string | null
          first_name: string
          full_name: string | null
          id: string
          last_name: string
          nationality_country_id: string | null
        }
        Insert: {
          birth_country_id?: string | null
          birth_place?: string | null
          dob?: string | null
          dod?: string | null
          first_name: string
          full_name?: string | null
          id?: string
          last_name: string
          nationality_country_id?: string | null
        }
        Update: {
          birth_country_id?: string | null
          birth_place?: string | null
          dob?: string | null
          dod?: string | null
          first_name?: string
          full_name?: string | null
          id?: string
          last_name?: string
          nationality_country_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_birth_country_id_fkey"
            columns: ["birth_country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_nationality_country_id_fkey"
            columns: ["nationality_country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
        ]
      }
      player: {
        Row: {
          aka: string | null
          current_team_id: string | null
          height_cm: number | null
          id: string
          person_id: string
          position: Database["football"]["Enums"]["position_group"] | null
          preferred_foot: Database["football"]["Enums"]["preferred_foot"] | null
        }
        Insert: {
          aka?: string | null
          current_team_id?: string | null
          height_cm?: number | null
          id?: string
          person_id: string
          position?: Database["football"]["Enums"]["position_group"] | null
          preferred_foot?:
            | Database["football"]["Enums"]["preferred_foot"]
            | null
        }
        Update: {
          aka?: string | null
          current_team_id?: string | null
          height_cm?: number | null
          id?: string
          person_id?: string
          position?: Database["football"]["Enums"]["position_group"] | null
          preferred_foot?:
            | Database["football"]["Enums"]["preferred_foot"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "player_current_team_id_fkey"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "player_details"
            referencedColumns: ["person_id"]
          },
        ]
      }
      player_team_tenure: {
        Row: {
          end_date: string | null
          id: string
          parent_team_id: string | null
          player_id: string
          relationship_type: Database["football"]["Enums"]["player_team_relationship_type"]
          start_date: string | null
          team_id: string
        }
        Insert: {
          end_date?: string | null
          id?: string
          parent_team_id?: string | null
          player_id: string
          relationship_type: Database["football"]["Enums"]["player_team_relationship_type"]
          start_date?: string | null
          team_id: string
        }
        Update: {
          end_date?: string | null
          id?: string
          parent_team_id?: string | null
          player_id?: string
          relationship_type?: Database["football"]["Enums"]["player_team_relationship_type"]
          start_date?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_team_tenure_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_tenure_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_tenure_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_tenure_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_tenure_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_tenure_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_tenure_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      round: {
        Row: {
          id: string
          name: string
          round_order: number
          season_id: string
          stage_type: Database["football"]["Enums"]["stage_type"]
        }
        Insert: {
          id?: string
          name: string
          round_order: number
          season_id: string
          stage_type: Database["football"]["Enums"]["stage_type"]
        }
        Update: {
          id?: string
          name?: string
          round_order?: number
          season_id?: string
          stage_type?: Database["football"]["Enums"]["stage_type"]
        }
        Relationships: [
          {
            foreignKeyName: "round_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
        ]
      }
      season: {
        Row: {
          competition_id: string
          draw_points: number
          end_date: string
          id: string
          loss_points: number
          name: string
          start_date: string
          win_points: number
        }
        Insert: {
          competition_id: string
          draw_points?: number
          end_date: string
          id?: string
          loss_points?: number
          name: string
          start_date: string
          win_points?: number
        }
        Update: {
          competition_id?: string
          draw_points?: number
          end_date?: string
          id?: string
          loss_points?: number
          name?: string
          start_date?: string
          win_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "season_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition"
            referencedColumns: ["id"]
          },
        ]
      }
      season_award: {
        Row: {
          award_level: number | null
          award_type: string
          id: string
          is_shared: boolean
          player_id: string | null
          season_id: string
          team_id: string | null
        }
        Insert: {
          award_level?: number | null
          award_type: string
          id?: string
          is_shared?: boolean
          player_id?: string | null
          season_id: string
          team_id?: string | null
        }
        Update: {
          award_level?: number | null
          award_type?: string
          id?: string
          is_shared?: boolean
          player_id?: string | null
          season_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_award_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_award_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_player: {
        Row: {
          id: string
          player_id: string
          position: Database["football"]["Enums"]["position_group"] | null
          season_id: string
          shirt_number: number | null
          team_id: string
        }
        Insert: {
          id?: string
          player_id: string
          position?: Database["football"]["Enums"]["position_group"] | null
          season_id: string
          shirt_number?: number | null
          team_id: string
        }
        Update: {
          id?: string
          player_id?: string
          position?: Database["football"]["Enums"]["position_group"] | null
          season_id?: string
          shirt_number?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_player_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_player_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      standing: {
        Row: {
          drawn: number
          goal_difference: number
          goals_against: number
          goals_for: number
          group_id: string | null
          id: string
          lost: number
          played: number
          points: number
          position: number
          season_id: string
          team_id: string
          won: number
        }
        Insert: {
          drawn?: number
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          group_id?: string | null
          id?: string
          lost?: number
          played?: number
          points?: number
          position?: number
          season_id: string
          team_id: string
          won?: number
        }
        Update: {
          drawn?: number
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          group_id?: string | null
          id?: string
          lost?: number
          played?: number
          points?: number
          position?: number
          season_id?: string
          team_id?: string
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "standing_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standing_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standing_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      team: {
        Row: {
          code: string
          colours: string[]
          country_id: string | null
          founded: number | null
          home_venue_id: string | null
          id: string
          logo_url: string | null
          name: string
          nicknames: string[]
          short_name: string | null
          type: Database["football"]["Enums"]["team_type"]
          website: string | null
        }
        Insert: {
          code: string
          colours?: string[]
          country_id?: string | null
          founded?: number | null
          home_venue_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
          nicknames?: string[]
          short_name?: string | null
          type: Database["football"]["Enums"]["team_type"]
          website?: string | null
        }
        Update: {
          code?: string
          colours?: string[]
          country_id?: string | null
          founded?: number | null
          home_venue_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          nicknames?: string[]
          short_name?: string | null
          type?: Database["football"]["Enums"]["team_type"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_home_venue_id_fkey"
            columns: ["home_venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
        ]
      }
      team_award: {
        Row: {
          award_level: number | null
          award_type: string
          id: string
          is_shared: boolean
          player_id: string
          team_id: string
        }
        Insert: {
          award_level?: number | null
          award_type: string
          id?: string
          is_shared?: boolean
          player_id: string
          team_id: string
        }
        Update: {
          award_level?: number | null
          award_type?: string
          id?: string
          is_shared?: boolean
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_award_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      team_captain: {
        Row: {
          captain_type: string | null
          end_date: string | null
          id: string
          player_id: string
          start_date: string | null
          team_id: string
        }
        Insert: {
          captain_type?: string | null
          end_date?: string | null
          id?: string
          player_id: string
          start_date?: string | null
          team_id: string
        }
        Update: {
          captain_type?: string | null
          end_date?: string | null
          id?: string
          player_id?: string
          start_date?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_captain_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_captain_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_career_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_captain_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_captain_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_match_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_captain_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_season_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_captain_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      team_coach_tenure: {
        Row: {
          end_date: string | null
          id: string
          person_id: string
          start_date: string | null
          team_id: string
          title: Database["football"]["Enums"]["coach_role"]
        }
        Insert: {
          end_date?: string | null
          id?: string
          person_id: string
          start_date?: string | null
          team_id: string
          title: Database["football"]["Enums"]["coach_role"]
        }
        Update: {
          end_date?: string | null
          id?: string
          person_id?: string
          start_date?: string | null
          team_id?: string
          title?: Database["football"]["Enums"]["coach_role"]
        }
        Relationships: [
          {
            foreignKeyName: "team_coach_tenure_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_coach_tenure_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "player_details"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "team_coach_tenure_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      team_season: {
        Row: {
          id: string
          season_id: string
          team_id: string
        }
        Insert: {
          id?: string
          season_id: string
          team_id: string
        }
        Update: {
          id?: string
          season_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_season_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_season_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      team_standing_adjustment: {
        Row: {
          effective_date: string | null
          id: string
          points_adjustment: number
          reason: string | null
          season_id: string
          source: string | null
          standing_id: string | null
          team_id: string
        }
        Insert: {
          effective_date?: string | null
          id?: string
          points_adjustment: number
          reason?: string | null
          season_id: string
          source?: string | null
          standing_id?: string | null
          team_id: string
        }
        Update: {
          effective_date?: string | null
          id?: string
          points_adjustment?: number
          reason?: string | null
          season_id?: string
          source?: string | null
          standing_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_standing_adjustment_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_standing_adjustment_standing_id_fkey"
            columns: ["standing_id"]
            isOneToOne: false
            referencedRelation: "standing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_standing_adjustment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      venue: {
        Row: {
          city: string
          country_id: string
          id: string
          name: string | null
          slug: string | null
        }
        Insert: {
          city: string
          country_id: string
          id?: string
          name?: string | null
          slug?: string | null
        }
        Update: {
          city?: string
          country_id?: string
          id?: string
          name?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      player_career_stats: {
        Row: {
          aka: string | null
          appearances: number | null
          assists: number | null
          clean_sheets: number | null
          competition: string | null
          competition_category:
            | Database["football"]["Enums"]["competition_category"]
            | null
          competition_id: string | null
          competition_type:
            | Database["football"]["Enums"]["competition_type"]
            | null
          full_name: string | null
          goalkeeper: boolean | null
          goals: number | null
          id: string | null
          minutes_played: number | null
          own_goals: number | null
          penalties: number | null
          penalties_missed: number | null
          penalties_taken: number | null
          penalty_saves: number | null
          red_cards: number | null
          saves: number | null
          second_yellows: number | null
          starter: number | null
          team_id: string | null
          team_type: Database["football"]["Enums"]["team_type"] | null
          yellow_cards: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_lineup_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition"
            referencedColumns: ["id"]
          },
        ]
      }
      player_details: {
        Row: {
          aka: string | null
          birth_country: string | null
          birth_country_icon: string | null
          birth_country_id: string | null
          birth_place: string | null
          dob: string | null
          dod: string | null
          first_name: string | null
          full_name: string | null
          height_cm: number | null
          icon: string | null
          id: string | null
          label: string | null
          last_name: string | null
          nationality_country_id: string | null
          person_id: string | null
          position: Database["football"]["Enums"]["position_group"] | null
          preferred_foot: Database["football"]["Enums"]["preferred_foot"] | null
          search_text: string | null
          team_id: string | null
          team_logo: string | null
          team_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_birth_country_id_fkey"
            columns: ["birth_country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_nationality_country_id_fkey"
            columns: ["nationality_country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_current_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          aka: string | null
          appearance: boolean | null
          assists: number | null
          away_score: number | null
          away_team_id: string | null
          clean_sheet: boolean | null
          full_name: string | null
          goals: number | null
          home_score: number | null
          home_team_id: string | null
          id: string | null
          kickoff_time: string | null
          match_id: string | null
          minutes_played: number | null
          own_goals: number | null
          penalties: number | null
          penalties_missed: number | null
          penalties_taken: number | null
          penalty_saves: number | null
          position: string | null
          red_cards: number | null
          result: string | null
          saves: number | null
          season_id: string | null
          second_yellows: number | null
          starter: boolean | null
          team_id: string | null
          yellow_cards: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_stats: {
        Row: {
          aka: string | null
          appearances: number | null
          assists: number | null
          clean_sheets: number | null
          end_date: string | null
          full_name: string | null
          goalkeeper: boolean | null
          goals: number | null
          id: string | null
          minutes_played: number | null
          own_goals: number | null
          penalties: number | null
          penalties_missed: number | null
          penalties_taken: number | null
          penalty_saves: number | null
          red_cards: number | null
          saves: number | null
          season: string | null
          season_id: string | null
          second_yellows: number | null
          start_date: string | null
          starter: number | null
          team_id: string | null
          team_type: Database["football"]["Enums"]["team_type"] | null
          yellow_cards: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_lineup_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      search_people: {
        Args: { search_term: string }
        Returns: {
          full_name: string
          icon: string
          id: string
        }[]
      }
      search_players: {
        Args: { search_term: string }
        Returns: {
          aka: string
          full_name: string
          icon: string
          id: string
        }[]
      }
    }
    Enums: {
      coach_role:
        | "manager"
        | "head_coach"
        | "caretaker"
        | "assistant_coach"
        | "goalkeeping_coach"
      competition_category: "domestic" | "continental" | "international"
      competition_type:
        | "league"
        | "cup"
        | "playoff"
        | "super_cup"
        | "friendly"
        | "tournament"
      goal_execution:
        | "tap_in"
        | "header"
        | "volley"
        | "half_volley"
        | "chip_lob"
        | "bicycle_kick"
        | "curler"
        | "backheel"
        | "deflection"
        | "long_range"
        | "own_goal"
        | "unknown"
      goal_situation:
        | "open_play"
        | "penalty"
        | "direct_free_kick"
        | "indirect_free_kick"
        | "corner"
        | "olympic_goal"
        | "own_goal"
        | "counter_attack"
        | "unknown"
      match_award_type: "man_of_the_match" | "player_of_the_match"
      match_decision:
        | "normal"
        | "extra_time"
        | "penalties"
        | "walkover"
        | "awarded"
      match_event_role:
        | "scorer"
        | "assist"
        | "sub_on"
        | "sub_off"
        | "carded_player"
        | "fouled_player"
        | "committed_by"
        | "own_goal_scorer"
        | "penalty_taker"
        | "penalty_won_by"
        | "penalty_conceded_by"
        | "keeper"
        | "injured_player"
      match_event_type:
        | "goal"
        | "save"
        | "red_card"
        | "yellow_card"
        | "second_yellow_card"
        | "penalty_missed"
        | "penalty_saved"
        | "substitution"
        | "injury"
      match_status:
        | "scheduled"
        | "full_time"
        | "cancelled"
        | "postponed"
        | "abandoned"
      na_affiliation_type:
        | "birth"
        | "nationality"
        | "player_allegiance"
        | "coach_appointment"
      player_team_relationship_type: "permanent" | "loan" | "reserve"
      position_group: "goalkeeper" | "defender" | "midfielder" | "forward"
      preferred_foot: "left" | "right"
      referee_type:
        | "referee"
        | "assistant_referee"
        | "fourth_official"
        | "reserve_assistant_referee"
        | "var"
        | "assistant_var"
        | "support_var"
      stage_type: "group" | "knockout" | "league"
      team_type: "club" | "national_team" | "representative_team"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      countries: {
        Row: {
          alpha_2: string | null
          continent: Database["public"]["Enums"]["continent_enum"]
          icon: string
          id: string
          name: string
        }
        Insert: {
          alpha_2?: string | null
          continent: Database["public"]["Enums"]["continent_enum"]
          icon: string
          id: string
          name: string
        }
        Update: {
          alpha_2?: string | null
          continent?: Database["public"]["Enums"]["continent_enum"]
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      defaults: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id: string
          player_id: string | null
          reason: string | null
        }
        Insert: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"]
          entry_id?: string
          event_id?: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "defaults_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defaults_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defaults_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "defaults_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "defaults_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defaults_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defaults_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      editions: {
        Row: {
          category: string | null
          currency: Database["public"]["Enums"]["currency_enum"] | null
          draw_link: string | null
          draw_type: Database["public"]["Enums"]["draws_enum"] | null
          end_date: string | null
          id: number
          sponsor_name: string | null
          start_date: string | null
          tfc: number | null
          tournament_id: number
          tours: Database["public"]["Enums"]["tour_enum"][]
          updated_at: string
          wiki_link: string | null
          year: number
        }
        Insert: {
          category?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"] | null
          draw_link?: string | null
          draw_type?: Database["public"]["Enums"]["draws_enum"] | null
          end_date?: string | null
          id: number
          sponsor_name?: string | null
          start_date?: string | null
          tfc?: number | null
          tournament_id: number
          tours?: Database["public"]["Enums"]["tour_enum"][]
          updated_at?: string
          wiki_link?: string | null
          year: number
        }
        Update: {
          category?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"] | null
          draw_link?: string | null
          draw_type?: Database["public"]["Enums"]["draws_enum"] | null
          end_date?: string | null
          id?: number
          sponsor_name?: string | null
          start_date?: string | null
          tfc?: number | null
          tournament_id?: number
          tours?: Database["public"]["Enums"]["tour_enum"][]
          updated_at?: string
          wiki_link?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "editions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "record"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "editions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          captain: string | null
          country_id: string | null
          event_id: string
          id: string
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          pm: number | null
          points: number | null
          team_name: string | null
          vc: string | null
        }
        Insert: {
          captain?: string | null
          country_id?: string | null
          event_id: string
          id: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          pm?: number | null
          points?: number | null
          team_name?: string | null
          vc?: string | null
        }
        Update: {
          captain?: string | null
          country_id?: string | null
          event_id?: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          pm?: number | null
          points?: number | null
          team_name?: string | null
          vc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entries_captain_fkey"
            columns: ["captain"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "entries_captain_fkey"
            columns: ["captain"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "entries_captain_fkey"
            columns: ["captain"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_captain_fkey"
            columns: ["captain"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_captain_fkey"
            columns: ["captain"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_vc_fkey"
            columns: ["vc"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "entries_vc_fkey"
            columns: ["vc"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "entries_vc_fkey"
            columns: ["vc"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_vc_fkey"
            columns: ["vc"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_vc_fkey"
            columns: ["vc"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_status: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["status_enum"]
        }
        Insert: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id?: string
          status: Database["public"]["Enums"]["status_enum"]
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"]
          entry_id?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "entry_status_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_status_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_supervisor_mapping: {
        Row: {
          event_id: string
          id: string
          supervisor_id: string
        }
        Insert: {
          event_id: string
          id?: string
          supervisor_id: string
        }
        Update: {
          event_id?: string
          id?: string
          supervisor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_supervisor_mapping_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_supervisor_mapping_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      event_surface_mapping: {
        Row: {
          event_id: string
          id: string
          surface_id: string
        }
        Insert: {
          event_id: string
          id?: string
          surface_id: string
        }
        Update: {
          event_id?: string
          id?: string
          surface_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_surface_mapping_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_surface_mapping_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      event_venue_mapping: {
        Row: {
          event_id: string
          id: string
          venue_id: string
        }
        Insert: {
          event_id: string
          id?: string
          venue_id: string
        }
        Update: {
          event_id?: string
          id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_venue_mapping_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_venue_mapping_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          currency: Database["public"]["Enums"]["currency_enum"] | null
          d_draw: Database["public"]["Enums"]["draws_enum"] | null
          d_link: string | null
          edition_id: number | null
          end_date: string | null
          id: string
          level: Database["public"]["Enums"]["level_enum"] | null
          pm: number | null
          qd_draw: Database["public"]["Enums"]["draws_enum"] | null
          qd_link: string | null
          qs_draw: Database["public"]["Enums"]["draws_enum"] | null
          qs_link: string | null
          s_draw: Database["public"]["Enums"]["draws_enum"] | null
          s_link: string | null
          site_link: string | null
          sponsor_name: string | null
          start_date: string | null
          tfc: number | null
          tour: Database["public"]["Enums"]["tour_enum"] | null
          undefeated_bonus: number | null
          updated_at: string
          wiki_link: string | null
        }
        Insert: {
          category?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"] | null
          d_draw?: Database["public"]["Enums"]["draws_enum"] | null
          d_link?: string | null
          edition_id?: number | null
          end_date?: string | null
          id: string
          level?: Database["public"]["Enums"]["level_enum"] | null
          pm?: number | null
          qd_draw?: Database["public"]["Enums"]["draws_enum"] | null
          qd_link?: string | null
          qs_draw?: Database["public"]["Enums"]["draws_enum"] | null
          qs_link?: string | null
          s_draw?: Database["public"]["Enums"]["draws_enum"] | null
          s_link?: string | null
          site_link?: string | null
          sponsor_name?: string | null
          start_date?: string | null
          tfc?: number | null
          tour?: Database["public"]["Enums"]["tour_enum"] | null
          undefeated_bonus?: number | null
          updated_at?: string
          wiki_link?: string | null
        }
        Update: {
          category?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"] | null
          d_draw?: Database["public"]["Enums"]["draws_enum"] | null
          d_link?: string | null
          edition_id?: number | null
          end_date?: string | null
          id?: string
          level?: Database["public"]["Enums"]["level_enum"] | null
          pm?: number | null
          qd_draw?: Database["public"]["Enums"]["draws_enum"] | null
          qd_link?: string | null
          qs_draw?: Database["public"]["Enums"]["draws_enum"] | null
          qs_link?: string | null
          s_draw?: Database["public"]["Enums"]["draws_enum"] | null
          s_link?: string | null
          site_link?: string | null
          sponsor_name?: string | null
          start_date?: string | null
          tfc?: number | null
          tour?: Database["public"]["Enums"]["tour_enum"] | null
          undefeated_bonus?: number | null
          updated_at?: string
          wiki_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "record"
            referencedColumns: ["edition_id"]
          },
        ]
      }
      ldas: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id: string
          rank: number | null
        }
        Insert: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id?: string
          rank?: number | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"]
          entry_id?: string
          event_id?: string
          id?: string
          rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ldas_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ldas_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scores: {
        Row: {
          entry_id: string
          id: string
          match_id: string
          set: number | null
          set_no: number | null
          tb: number | null
        }
        Insert: {
          entry_id: string
          id?: string
          match_id: string
          set?: number | null
          set_no?: number | null
          tb?: number | null
        }
        Update: {
          entry_id?: string
          id?: string
          match_id?: string
          set?: number | null
          set_no?: number | null
          tb?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_stats: {
        Row: {
          aces: number | null
          avg1_speed: number | null
          avg2_speed: number | null
          bp_opps: number | null
          bps_converted: number | null
          bps_faced: number | null
          bps_saved: number | null
          dfs: number | null
          entry_id: string
          id: string
          match_id: string
          max_speed: number | null
          net: number | null
          net_w: number | null
          ret1: number | null
          ret1_w: number | null
          ret2: number | null
          ret2_w: number | null
          return_games: number | null
          serve_games: number | null
          serve1: number | null
          serve1_w: number | null
          serve2: number | null
          serve2_w: number | null
          ues: number | null
          winners: number | null
        }
        Insert: {
          aces?: number | null
          avg1_speed?: number | null
          avg2_speed?: number | null
          bp_opps?: number | null
          bps_converted?: number | null
          bps_faced?: number | null
          bps_saved?: number | null
          dfs?: number | null
          entry_id: string
          id?: string
          match_id: string
          max_speed?: number | null
          net?: number | null
          net_w?: number | null
          ret1?: number | null
          ret1_w?: number | null
          ret2?: number | null
          ret2_w?: number | null
          return_games?: number | null
          serve_games?: number | null
          serve1?: number | null
          serve1_w?: number | null
          serve2?: number | null
          serve2_w?: number | null
          ues?: number | null
          winners?: number | null
        }
        Update: {
          aces?: number | null
          avg1_speed?: number | null
          avg2_speed?: number | null
          bp_opps?: number | null
          bps_converted?: number | null
          bps_faced?: number | null
          bps_saved?: number | null
          dfs?: number | null
          entry_id?: string
          id?: string
          match_id?: string
          max_speed?: number | null
          net?: number | null
          net_w?: number | null
          ret1?: number | null
          ret1_w?: number | null
          ret2?: number | null
          ret2_w?: number | null
          return_games?: number | null
          serve_games?: number | null
          serve1?: number | null
          serve1_w?: number | null
          serve2?: number | null
          serve2_w?: number | null
          ues?: number | null
          winners?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_stats_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          court: string | null
          date: string | null
          draw: Database["public"]["Enums"]["draw_enum"]
          duration: string | null
          format: number
          group_name: string | null
          id: string
          incomplete: Database["public"]["Enums"]["incomplete_enum"] | null
          loser_id: string | null
          match_no: number
          match_type: Database["public"]["Enums"]["match_type_enum"]
          round_id: string
          team_1_id: string | null
          team_2_id: string | null
          tie_id: string | null
          tour: Database["public"]["Enums"]["tour_enum"] | null
          umpire_id: string | null
          winner_id: string | null
        }
        Insert: {
          court?: string | null
          date?: string | null
          draw: Database["public"]["Enums"]["draw_enum"]
          duration?: string | null
          format?: number
          group_name?: string | null
          id?: string
          incomplete?: Database["public"]["Enums"]["incomplete_enum"] | null
          loser_id?: string | null
          match_no: number
          match_type: Database["public"]["Enums"]["match_type_enum"]
          round_id: string
          team_1_id?: string | null
          team_2_id?: string | null
          tie_id?: string | null
          tour?: Database["public"]["Enums"]["tour_enum"] | null
          umpire_id?: string | null
          winner_id?: string | null
        }
        Update: {
          court?: string | null
          date?: string | null
          draw?: Database["public"]["Enums"]["draw_enum"]
          duration?: string | null
          format?: number
          group_name?: string | null
          id?: string
          incomplete?: Database["public"]["Enums"]["incomplete_enum"] | null
          loser_id?: string | null
          match_no?: number
          match_type?: Database["public"]["Enums"]["match_type_enum"]
          round_id?: string
          team_1_id?: string | null
          team_2_id?: string | null
          tie_id?: string | null
          tour?: Database["public"]["Enums"]["tour_enum"] | null
          umpire_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_1_id_fkey"
            columns: ["team_1_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_2_id_fkey"
            columns: ["team_2_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tie_id_fkey"
            columns: ["tie_id"]
            isOneToOne: false
            referencedRelation: "ties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_umpire_id_fkey"
            columns: ["umpire_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          first_name: string
          full_name: string | null
          id: string
          last_name: string
          player_id: string | null
        }
        Insert: {
          first_name: string
          full_name?: string | null
          id?: string
          last_name: string
          player_id?: string | null
        }
        Update: {
          first_name?: string
          full_name?: string | null
          id?: string
          last_name?: string
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "people_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "people_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_coach_mapping: {
        Row: {
          coach_id: string
          id: string
          player_id: string
          status: string
          years: string | null
        }
        Insert: {
          coach_id: string
          id?: string
          player_id: string
          status?: string
          years?: string | null
        }
        Update: {
          coach_id?: string
          id?: string
          player_id?: string
          status?: string
          years?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_coach_mapping_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_coach_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "player_coach_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_coach_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_coach_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_coach_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_country_mapping: {
        Row: {
          country_id: string
          end_date: string | null
          id: string
          player_id: string
          start_date: string | null
        }
        Insert: {
          country_id: string
          end_date?: string | null
          id?: string
          player_id: string
          start_date?: string | null
        }
        Update: {
          country_id?: string
          end_date?: string | null
          id?: string
          player_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_country_mapping_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_country_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "player_country_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_country_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_country_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_country_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_entry_mapping: {
        Row: {
          country_id: string | null
          doubles_rank: number | null
          entry_id: string
          id: string
          player_id: string
          rank: number | null
        }
        Insert: {
          country_id?: string | null
          doubles_rank?: number | null
          entry_id: string
          id?: string
          player_id: string
          rank?: number | null
        }
        Update: {
          country_id?: string | null
          doubles_rank?: number | null
          entry_id?: string
          id?: string
          player_id?: string
          rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_entry_mapping_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          bh: string | null
          ch_doubles: number | null
          ch_doubles_date: string | null
          ch_singles: number | null
          ch_singles_date: string | null
          current_doubles: number | null
          current_singles: number | null
          dob: string | null
          dod: string | null
          first_name: string | null
          full_name: string | null
          height: number | null
          hof: number | null
          id: string
          last_name: string | null
          official_link: string | null
          pm: number | null
          retired: number | null
          rh: string | null
          site_link: string | null
          tour: Database["public"]["Enums"]["tour_enum"]
          turned_pro: number | null
          updated_at: string
          wiki_link: string | null
        }
        Insert: {
          bh?: string | null
          ch_doubles?: number | null
          ch_doubles_date?: string | null
          ch_singles?: number | null
          ch_singles_date?: string | null
          current_doubles?: number | null
          current_singles?: number | null
          dob?: string | null
          dod?: string | null
          first_name?: string | null
          full_name?: string | null
          height?: number | null
          hof?: number | null
          id: string
          last_name?: string | null
          official_link?: string | null
          pm?: number | null
          retired?: number | null
          rh?: string | null
          site_link?: string | null
          tour: Database["public"]["Enums"]["tour_enum"]
          turned_pro?: number | null
          updated_at?: string
          wiki_link?: string | null
        }
        Update: {
          bh?: string | null
          ch_doubles?: number | null
          ch_doubles_date?: string | null
          ch_singles?: number | null
          ch_singles_date?: string | null
          current_doubles?: number | null
          current_singles?: number | null
          dob?: string | null
          dod?: string | null
          first_name?: string | null
          full_name?: string | null
          height?: number | null
          hof?: number | null
          id?: string
          last_name?: string | null
          official_link?: string | null
          pm?: number | null
          retired?: number | null
          rh?: string | null
          site_link?: string | null
          tour?: Database["public"]["Enums"]["tour_enum"]
          turned_pro?: number | null
          updated_at?: string
          wiki_link?: string | null
        }
        Relationships: []
      }
      retirements: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id: string
          player_id: string | null
          reason: string | null
        }
        Insert: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"]
          entry_id?: string
          event_id?: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retirements_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retirements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retirements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "retirements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "retirements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retirements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retirements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"]
          event_id: string
          id: string
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          number: number
          pm: number | null
          pm_tiered: number[] | null
          points: number | null
          round: Database["public"]["Enums"]["round_enum"]
          tour: Database["public"]["Enums"]["tour_enum"] | null
        }
        Insert: {
          draw: Database["public"]["Enums"]["draw_enum"]
          event_id: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          number: number
          pm?: number | null
          pm_tiered?: number[] | null
          points?: number | null
          round: Database["public"]["Enums"]["round_enum"]
          tour?: Database["public"]["Enums"]["tour_enum"] | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"]
          event_id?: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          number?: number
          pm?: number | null
          pm_tiered?: number[] | null
          points?: number | null
          round?: Database["public"]["Enums"]["round_enum"]
          tour?: Database["public"]["Enums"]["tour_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      seeds: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id: string
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          rank: number | null
          seed: number
        }
        Insert: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          rank?: number | null
          seed: number
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"]
          entry_id?: string
          event_id?: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          rank?: number | null
          seed?: number
        }
        Relationships: [
          {
            foreignKeyName: "seeds_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seeds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      surfaces: {
        Row: {
          environment: Database["public"]["Enums"]["environment_enum"]
          id: string
          surface: Database["public"]["Enums"]["surface_enum"]
        }
        Insert: {
          environment: Database["public"]["Enums"]["environment_enum"]
          id?: string
          surface: Database["public"]["Enums"]["surface_enum"]
        }
        Update: {
          environment?: Database["public"]["Enums"]["environment_enum"]
          id?: string
          surface?: Database["public"]["Enums"]["surface_enum"]
        }
        Relationships: []
      }
      ties: {
        Row: {
          country_1_id: string
          country_2_id: string
          date: string | null
          group_name: string | null
          id: string
          loser_id: string
          round_id: string
          tie_number: number
          venue_id: string | null
          winner_id: string
        }
        Insert: {
          country_1_id: string
          country_2_id: string
          date?: string | null
          group_name?: string | null
          id?: string
          loser_id: string
          round_id: string
          tie_number: number
          venue_id?: string | null
          winner_id: string
        }
        Update: {
          country_1_id?: string
          country_2_id?: string
          date?: string | null
          group_name?: string | null
          id?: string
          loser_id?: string
          round_id?: string
          tie_number?: number
          venue_id?: string | null
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ties_country_1_id_fkey"
            columns: ["country_1_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ties_country_2_id_fkey"
            columns: ["country_2_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ties_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ties_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ties_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ties_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          abolished: number | null
          established: number | null
          id: number
          name: string
          tours: Database["public"]["Enums"]["tour_enum"][]
          updated_at: string
          website: string | null
        }
        Insert: {
          abolished?: number | null
          established?: number | null
          id: number
          name: string
          tours?: Database["public"]["Enums"]["tour_enum"][]
          updated_at?: string
          website?: string | null
        }
        Update: {
          abolished?: number | null
          established?: number | null
          id?: number
          name?: string
          tours?: Database["public"]["Enums"]["tour_enum"][]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string
          first_name: string
          id: string
          last_name: string
          profile_img: string | null
          username: string
        }
        Insert: {
          email: string
          first_name: string
          id: string
          last_name: string
          profile_img?: string | null
          username: string
        }
        Update: {
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          profile_img?: string | null
          username?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          city: string
          country_id: string
          id: string
          name: string | null
          slug: string | null
        }
        Insert: {
          city: string
          country_id: string
          id?: string
          name?: string | null
          slug?: string | null
        }
        Update: {
          city?: string
          country_id?: string
          id?: string
          name?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      walkovers: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id: string
          player_id: string | null
          reason: string | null
        }
        Insert: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"]
          entry_id?: string
          event_id?: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "walkovers_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkovers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkovers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "walkovers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "walkovers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkovers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkovers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id: string
          player_id: string | null
          reason: string | null
        }
        Insert: {
          draw: Database["public"]["Enums"]["draw_enum"]
          entry_id: string
          event_id: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"]
          entry_id?: string
          event_id?: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "withdrawals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "withdrawals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      activity: {
        Row: {
          category: string | null
          currency: Database["public"]["Enums"]["currency_enum"] | null
          draw: Database["public"]["Enums"]["draw_enum"] | null
          edition_id: number | null
          end_date: string | null
          event_id: string | null
          format: number | null
          group_name: string | null
          incomplete: Database["public"]["Enums"]["incomplete_enum"] | null
          level: Database["public"]["Enums"]["level_enum"] | null
          match_id: string | null
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          opponent: Json | null
          opponent_id: string | null
          partner_country: Json | null
          partner_first_name: string | null
          partner_id: string | null
          partner_last_name: string | null
          partner_rank: number | null
          player_id: string | null
          pm: number | null
          points: number | null
          q_seed: number | null
          q_status: Database["public"]["Enums"]["status_enum"] | null
          rank: number | null
          round: Database["public"]["Enums"]["round_enum"] | null
          round_number: number | null
          scores: Json | null
          seed: number | null
          sponsor_name: string | null
          start_date: string | null
          stats: boolean | null
          status: Database["public"]["Enums"]["status_enum"] | null
          tie_id: string | null
          tournament_id: number | null
          win: boolean | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "editions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "record"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "editions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "record"
            referencedColumns: ["edition_id"]
          },
          {
            foreignKeyName: "matches_tie_id_fkey"
            columns: ["tie_id"]
            isOneToOne: false
            referencedRelation: "ties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      country_big_titles: {
        Row: {
          category: string | null
          country_id: string | null
          edition_id: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          start_date: string | null
          tour: Database["public"]["Enums"]["tour_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "record"
            referencedColumns: ["edition_id"]
          },
          {
            foreignKeyName: "player_entry_mapping_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      player_list_view: {
        Row: {
          country: Json | null
          first_name: string | null
          first_tournament: number | null
          full_name: string | null
          id: string | null
          last_name: string | null
          last_tournament: number | null
          retired: number | null
          tour: Database["public"]["Enums"]["tour_enum"] | null
          turned_pro: number | null
        }
        Relationships: []
      }
      record: {
        Row: {
          edition_id: number | null
          furthest_round: Database["public"]["Enums"]["round_enum"] | null
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          player_id: string | null
          tournament_id: number | null
          tournament_name: string | null
          win: boolean | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      scores_by_teams: {
        Row: {
          match_id: string | null
          set_no: number | null
          t1_id: string | null
          t1_set: number | null
          t1_tb: number | null
          t2_id: string | null
          t2_set: number | null
          t2_tb: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_entry_id_fkey"
            columns: ["t2_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_entry_id_fkey"
            columns: ["t1_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      scores_by_winner: {
        Row: {
          match_id: string | null
          set_no: number | null
          t1_id: string | null
          t1_set: number | null
          t1_tb: number | null
          t2_id: string | null
          t2_set: number | null
          t2_tb: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_entry_id_fkey"
            columns: ["t1_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_entry_id_fkey"
            columns: ["t2_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_finalists: {
        Row: {
          country_id: string | null
          edition_id: number | null
          entry_info: Database["public"]["Enums"]["status_enum"] | null
          games_lost: number | null
          games_won: number | null
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          player_id: string | null
          rank: number | null
          sets_lost: number | null
          sets_won: number | null
          tour: Database["public"]["Enums"]["tour_enum"] | null
          tournament_id: number | null
          winner: boolean | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "editions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "record"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "editions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "record"
            referencedColumns: ["edition_id"]
          },
          {
            foreignKeyName: "player_entry_mapping_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "country_big_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_entry_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_seed_stats: {
        Row: {
          id: number | null
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          round: string | null
          team: Json | null
          tour: Database["public"]["Enums"]["tour_enum"] | null
          tournament_id: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_activity_options: {
        Args: { player_id: string }
        Returns: {
          categories: string[]
          tournaments: Json[]
        }[]
      }
      search_venues: {
        Args: { schema_name: string; search_text: string }
        Returns: {
          city: string
          icon: string
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      continent_enum:
        | "Africa"
        | "Asia"
        | "Europe"
        | "North America"
        | "Oceania"
        | "South America"
      currency_enum: "AUD" | "EUR" | "FRF" | "GBP" | "USD"
      draw_enum: "Main" | "Qualifying"
      draws_enum:
        | "Round of 128"
        | "Round of 96"
        | "Round of 64"
        | "Round of 48"
        | "Round of 32"
        | "Round of 28"
        | "Round of 24"
        | "Round of 16"
        | "Round of 8"
        | "Round of 4"
        | "Round robin"
        | "Country draw"
        | "Laver Cup"
        | "Davis Cup"
      environment_enum: "Indoor" | "Outdoor"
      incomplete_enum: "B" | "WO" | "D" | "R"
      level_enum: "Tour" | "Challenger" | "ITF"
      match_type_enum: "Singles" | "Doubles"
      round_enum:
        | "Day 1"
        | "Day 2"
        | "Day 3"
        | "Participation"
        | "Alternate"
        | "Group stage"
        | "Round robin"
        | "Qualifying round 1"
        | "Qualifying round 2"
        | "Qualifying round 3"
        | "Final"
        | "Semifinals"
        | "Quarterfinals"
        | "Qualifier"
        | "Round of 128"
        | "Round of 64"
        | "Round of 32"
        | "Round of 16"
        | "Win"
        | "Bronze Medal Match"
        | "3rd Place Match"
      status_enum: "AL" | "CO" | "JR" | "LL" | "NG" | "Q" | "PR" | "SE" | "WC"
      surface_enum: "Clay" | "Grass" | "Hard" | "Carpet"
      tour_enum: "ATP" | "WTA" | "ITF-M" | "ITF-W"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  football: {
    Enums: {
      coach_role: [
        "manager",
        "head_coach",
        "caretaker",
        "assistant_coach",
        "goalkeeping_coach",
      ],
      competition_category: ["domestic", "continental", "international"],
      competition_type: [
        "league",
        "cup",
        "playoff",
        "super_cup",
        "friendly",
        "tournament",
      ],
      goal_execution: [
        "tap_in",
        "header",
        "volley",
        "half_volley",
        "chip_lob",
        "bicycle_kick",
        "curler",
        "backheel",
        "deflection",
        "long_range",
        "own_goal",
        "unknown",
      ],
      goal_situation: [
        "open_play",
        "penalty",
        "direct_free_kick",
        "indirect_free_kick",
        "corner",
        "olympic_goal",
        "own_goal",
        "counter_attack",
        "unknown",
      ],
      match_award_type: ["man_of_the_match", "player_of_the_match"],
      match_decision: [
        "normal",
        "extra_time",
        "penalties",
        "walkover",
        "awarded",
      ],
      match_event_role: [
        "scorer",
        "assist",
        "sub_on",
        "sub_off",
        "carded_player",
        "fouled_player",
        "committed_by",
        "own_goal_scorer",
        "penalty_taker",
        "penalty_won_by",
        "penalty_conceded_by",
        "keeper",
        "injured_player",
      ],
      match_event_type: [
        "goal",
        "save",
        "red_card",
        "yellow_card",
        "second_yellow_card",
        "penalty_missed",
        "penalty_saved",
        "substitution",
        "injury",
      ],
      match_status: [
        "scheduled",
        "full_time",
        "cancelled",
        "postponed",
        "abandoned",
      ],
      na_affiliation_type: [
        "birth",
        "nationality",
        "player_allegiance",
        "coach_appointment",
      ],
      player_team_relationship_type: ["permanent", "loan", "reserve"],
      position_group: ["goalkeeper", "defender", "midfielder", "forward"],
      preferred_foot: ["left", "right"],
      referee_type: [
        "referee",
        "assistant_referee",
        "fourth_official",
        "reserve_assistant_referee",
        "var",
        "assistant_var",
        "support_var",
      ],
      stage_type: ["group", "knockout", "league"],
      team_type: ["club", "national_team", "representative_team"],
    },
  },
  public: {
    Enums: {
      continent_enum: [
        "Africa",
        "Asia",
        "Europe",
        "North America",
        "Oceania",
        "South America",
      ],
      currency_enum: ["AUD", "EUR", "FRF", "GBP", "USD"],
      draw_enum: ["Main", "Qualifying"],
      draws_enum: [
        "Round of 128",
        "Round of 96",
        "Round of 64",
        "Round of 48",
        "Round of 32",
        "Round of 28",
        "Round of 24",
        "Round of 16",
        "Round of 8",
        "Round of 4",
        "Round robin",
        "Country draw",
        "Laver Cup",
        "Davis Cup",
      ],
      environment_enum: ["Indoor", "Outdoor"],
      incomplete_enum: ["B", "WO", "D", "R"],
      level_enum: ["Tour", "Challenger", "ITF"],
      match_type_enum: ["Singles", "Doubles"],
      round_enum: [
        "Day 1",
        "Day 2",
        "Day 3",
        "Participation",
        "Alternate",
        "Group stage",
        "Round robin",
        "Qualifying round 1",
        "Qualifying round 2",
        "Qualifying round 3",
        "Final",
        "Semifinals",
        "Quarterfinals",
        "Qualifier",
        "Round of 128",
        "Round of 64",
        "Round of 32",
        "Round of 16",
        "Win",
        "Bronze Medal Match",
        "3rd Place Match",
      ],
      status_enum: ["AL", "CO", "JR", "LL", "NG", "Q", "PR", "SE", "WC"],
      surface_enum: ["Clay", "Grass", "Hard", "Carpet"],
      tour_enum: ["ATP", "WTA", "ITF-M", "ITF-W"],
    },
  },
} as const
