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
          code: string | null
          confederation_id: string | null
          division_level: number | null
          emblem_url: string | null
          fifa_governed: boolean
          id: string
          name: string
          national_association_id: string | null
          promotion_id: string | null
          relegation_id: string | null
          type: Database["football"]["Enums"]["competition_type"]
        }
        Insert: {
          category: Database["football"]["Enums"]["competition_category"]
          code?: string | null
          confederation_id?: string | null
          division_level?: number | null
          emblem_url?: string | null
          fifa_governed?: boolean
          id?: string
          name: string
          national_association_id?: string | null
          promotion_id?: string | null
          relegation_id?: string | null
          type: Database["football"]["Enums"]["competition_type"]
        }
        Update: {
          category?: Database["football"]["Enums"]["competition_category"]
          code?: string | null
          confederation_id?: string | null
          division_level?: number | null
          emblem_url?: string | null
          fifa_governed?: boolean
          id?: string
          name?: string
          national_association_id?: string | null
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
            foreignKeyName: "competition_national_association_id_fkey"
            columns: ["national_association_id"]
            isOneToOne: false
            referencedRelation: "national_association"
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
          alpha_2: string | null
          continent:
            | "Africa"
            | "Asia"
            | "Europe"
            | "North America"
            | "Oceania"
            | "South America"
          icon: string
          id: string
          name: string
        }
        Insert: {
          alpha_2?: string | null
          continent:
            | "Africa"
            | "Asia"
            | "Europe"
            | "North America"
            | "Oceania"
            | "South America"
          icon: string
          id: string
          name: string
        }
        Update: {
          alpha_2?: string | null
          continent?:
            | "Africa"
            | "Asia"
            | "Europe"
            | "North America"
            | "Oceania"
            | "South America"
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
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
          match_no?: number
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
          id: string
          match_id: string
          player_id: string | null
          source: string | null
          team_id: string | null
          type: Database["football"]["Enums"]["match_award_type"]
        }
        Insert: {
          id?: string
          match_id: string
          player_id?: string | null
          source?: string | null
          team_id?: string | null
          type: Database["football"]["Enums"]["match_award_type"]
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string | null
          source?: string | null
          team_id?: string | null
          type?: Database["football"]["Enums"]["match_award_type"]
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
            foreignKeyName: "match_award_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
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
          detail: string | null
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
          detail?: string | null
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
          detail?: string | null
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
        ]
      }
      match_lineup: {
        Row: {
          captain: boolean
          id: string
          match_id: string
          player_id: string
          position_id: string | null
          shirt_number: number | null
          starter: boolean
          team_id: string
        }
        Insert: {
          captain?: boolean
          id?: string
          match_id: string
          player_id: string
          position_id?: string | null
          shirt_number?: number | null
          starter?: boolean
          team_id: string
        }
        Update: {
          captain?: boolean
          id?: string
          match_id?: string
          player_id?: string
          position_id?: string | null
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
            foreignKeyName: "match_lineup_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "position"
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
            foreignKeyName: "match_referee_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
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
            foreignKeyName: "match_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      national_association: {
        Row: {
          confederation_id: string
          country_id: string
          fifa_member: boolean
          founded: number | null
          headquarters: string
          id: string
          logo_url: string | null
          name: string
          short_name: string | null
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
          short_name?: string | null
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
          short_name?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "national_association_confederation_id_fkey"
            columns: ["confederation_id"]
            isOneToOne: false
            referencedRelation: "confederation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "national_association_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_shootout_attempts: {
        Row: {
          attempt_number: number
          goalkeeper_id: string | null
          id: string
          is_sudden_death: boolean
          match_id: string
          outcome: string
          player_id: string | null
          team_attempt_number: number
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
          team_attempt_number: number
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
          team_attempt_number?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalty_shootout_attempts_goalkeeper_id_fkey"
            columns: ["goalkeeper_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempts_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_shootout_attempts_team_id_fkey"
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
      person_na_affiliation: {
        Row: {
          affiliation_type: Database["football"]["Enums"]["na_affiliation_type"]
          end_year: number | null
          id: string
          national_association_id: string
          notes: string | null
          person_id: string
          start_year: number | null
        }
        Insert: {
          affiliation_type: Database["football"]["Enums"]["na_affiliation_type"]
          end_year?: number | null
          id?: string
          national_association_id: string
          notes?: string | null
          person_id: string
          start_year?: number | null
        }
        Update: {
          affiliation_type?: Database["football"]["Enums"]["na_affiliation_type"]
          end_year?: number | null
          id?: string
          national_association_id?: string
          notes?: string | null
          person_id?: string
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "person_na_affiliation_national_association_id_fkey"
            columns: ["national_association_id"]
            isOneToOne: false
            referencedRelation: "national_association"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_na_affiliation_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      player: {
        Row: {
          aka: string | null
          current_position:
            | Database["football"]["Enums"]["position_group"]
            | null
          current_team_id: string | null
          height_cm: number | null
          id: string
          person_id: string
          preferred_foot: Database["football"]["Enums"]["preferred_foot"] | null
        }
        Insert: {
          aka?: string | null
          current_position?:
            | Database["football"]["Enums"]["position_group"]
            | null
          current_team_id?: string | null
          height_cm?: number | null
          id?: string
          person_id: string
          preferred_foot?:
            | Database["football"]["Enums"]["preferred_foot"]
            | null
        }
        Update: {
          aka?: string | null
          current_position?:
            | Database["football"]["Enums"]["position_group"]
            | null
          current_team_id?: string | null
          height_cm?: number | null
          id?: string
          person_id?: string
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
        ]
      }
      player_team_tenure: {
        Row: {
          end_date: string | null
          end_year: number | null
          id: string
          parent_team_id: string | null
          player_id: string
          relationship_type: Database["football"]["Enums"]["player_team_relationship_type"]
          start_date: string | null
          start_year: number | null
          team_id: string
        }
        Insert: {
          end_date?: string | null
          end_year?: number | null
          id?: string
          parent_team_id?: string | null
          player_id: string
          relationship_type: Database["football"]["Enums"]["player_team_relationship_type"]
          start_date?: string | null
          start_year?: number | null
          team_id: string
        }
        Update: {
          end_date?: string | null
          end_year?: number | null
          id?: string
          parent_team_id?: string | null
          player_id?: string
          relationship_type?: Database["football"]["Enums"]["player_team_relationship_type"]
          start_date?: string | null
          start_year?: number | null
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
            foreignKeyName: "player_team_tenure_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      position: {
        Row: {
          group_name: Database["football"]["Enums"]["position_group"]
          id: string
          name: string
          number: number
        }
        Insert: {
          group_name: Database["football"]["Enums"]["position_group"]
          id: string
          name: string
          number: number
        }
        Update: {
          group_name?: Database["football"]["Enums"]["position_group"]
          id?: string
          name?: string
          number?: number
        }
        Relationships: []
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
      season_awards: {
        Row: {
          award_type: string
          id: string
          is_shared: boolean
          player_id: string | null
          season_id: string
          team_id: string | null
        }
        Insert: {
          award_type: string
          id?: string
          is_shared?: boolean
          player_id?: string | null
          season_id: string
          team_id?: string | null
        }
        Update: {
          award_type?: string
          id?: string
          is_shared?: boolean
          player_id?: string | null
          season_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_awards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_awards_team_id_fkey"
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
          colours: string[]
          country_id: string | null
          founded: number | null
          home_venue_id: string | null
          id: string
          logo_url: string | null
          name: string
          national_association_id: string | null
          nicknames: string[]
          short_name: string | null
          tla: string | null
          type: Database["football"]["Enums"]["team_type"]
          website: string | null
        }
        Insert: {
          colours?: string[]
          country_id?: string | null
          founded?: number | null
          home_venue_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
          national_association_id?: string | null
          nicknames?: string[]
          short_name?: string | null
          tla?: string | null
          type: Database["football"]["Enums"]["team_type"]
          website?: string | null
        }
        Update: {
          colours?: string[]
          country_id?: string | null
          founded?: number | null
          home_venue_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          national_association_id?: string | null
          nicknames?: string[]
          short_name?: string | null
          tla?: string | null
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
          {
            foreignKeyName: "team_national_association_id_fkey"
            columns: ["national_association_id"]
            isOneToOne: false
            referencedRelation: "national_association"
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
      [_ in never]: never
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
        | "red_card"
        | "yellow_card"
        | "second_yellow_card"
        | "penalty_missed"
        | "penalty_saved"
        | "own_goal"
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
        | "reserve_assistance_referee"
        | "var_referee"
        | "assistant_var_referee"
        | "support_video_assistant_referee"
      stage_type: "group" | "knockout" | "league"
      team_type: "club" | "national_team" | "representative_team"
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
        "red_card",
        "yellow_card",
        "second_yellow_card",
        "penalty_missed",
        "penalty_saved",
        "own_goal",
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
        "reserve_assistance_referee",
        "var_referee",
        "assistant_var_referee",
        "support_video_assistant_referee",
      ],
      stage_type: ["group", "knockout", "league"],
      team_type: ["club", "national_team", "representative_team"],
    },
  },
} as const
