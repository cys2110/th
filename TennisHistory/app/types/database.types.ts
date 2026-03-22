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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      countries: {
        Row: {
          alpha_2: string | null
          continent: Database["public"]["Enums"]["continent_enum"]
          id: string
          name: string
        }
        Insert: {
          alpha_2?: string | null
          continent: Database["public"]["Enums"]["continent_enum"]
          id: string
          name: string
        }
        Update: {
          alpha_2?: string | null
          continent?: Database["public"]["Enums"]["continent_enum"]
          id?: string
          name?: string
        }
        Relationships: []
      }
      defaults: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id: string
          player_id: string | null
          reason: string | null
        }
        Insert: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
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
          tournament_id: number | null
          tours: Database["public"]["Enums"]["tour_enum"][] | null
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
          tournament_id?: number | null
          tours?: Database["public"]["Enums"]["tour_enum"][] | null
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
          tournament_id?: number | null
          tours?: Database["public"]["Enums"]["tour_enum"][] | null
          updated_at?: string
          wiki_link?: string | null
          year?: number
        }
        Relationships: [
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
          country_id: string | null
          event_id: string
          id: string
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          pm: number | null
          points: number | null
          team_name: string | null
        }
        Insert: {
          country_id?: string | null
          event_id: string
          id: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          pm?: number | null
          points?: number | null
          team_name?: string | null
        }
        Update: {
          country_id?: string | null
          event_id?: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          pm?: number | null
          points?: number | null
          team_name?: string | null
        }
        Relationships: [
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
        ]
      }
      entry_status: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["status_enum"] | null
        }
        Insert: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["status_enum"] | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["status_enum"] | null
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
          event_id: string | null
          id: string
          supervisor_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          supervisor_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          supervisor_id?: string | null
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
          event_id: string | null
          id: string
          surface_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          surface_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          surface_id?: string | null
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
          event_id: string | null
          id: string
          venue_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          venue_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          venue_id?: string | null
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
        ]
      }
      ldas: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id: string
          rank: number | null
        }
        Insert: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id?: string
          rank?: number | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
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
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          court: string | null
          date: string | null
          draw: Database["public"]["Enums"]["draw_enum"] | null
          duration: string | null
          format: number | null
          group_name: string | null
          id: string
          incomplete: Database["public"]["Enums"]["incomplete_enum"] | null
          loser_id: string | null
          match_no: number
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
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
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          duration?: string | null
          format?: number | null
          group_name?: string | null
          id?: string
          incomplete?: Database["public"]["Enums"]["incomplete_enum"] | null
          loser_id?: string | null
          match_no: number
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
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
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          duration?: string | null
          format?: number | null
          group_name?: string | null
          id?: string
          incomplete?: Database["public"]["Enums"]["incomplete_enum"] | null
          loser_id?: string | null
          match_no?: number
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
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
          first_name: string | null
          id: string
          last_name: string | null
          player_id: string | null
        }
        Insert: {
          first_name?: string | null
          id?: string
          last_name?: string | null
          player_id?: string | null
        }
        Update: {
          first_name?: string | null
          id?: string
          last_name?: string | null
          player_id?: string | null
        }
        Relationships: [
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
          coach_id: string | null
          id: string
          player_id: string | null
          status: string | null
          years: string | null
        }
        Insert: {
          coach_id?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          years?: string | null
        }
        Update: {
          coach_id?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
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
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_country_mapping: {
        Row: {
          country_id: string | null
          end_date: string | null
          id: string
          player_id: string | null
          start_date: string | null
        }
        Insert: {
          country_id?: string | null
          end_date?: string | null
          id?: string
          player_id?: string | null
          start_date?: string | null
        }
        Update: {
          country_id?: string | null
          end_date?: string | null
          id?: string
          player_id?: string | null
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
          height: number | null
          hof: number | null
          id: string
          last_name: string | null
          official_link: string | null
          pm: number | null
          retired: number | null
          rh: string | null
          site_link: string | null
          tour: Database["public"]["Enums"]["tour_enum"] | null
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
          height?: number | null
          hof?: number | null
          id: string
          last_name?: string | null
          official_link?: string | null
          pm?: number | null
          retired?: number | null
          rh?: string | null
          site_link?: string | null
          tour?: Database["public"]["Enums"]["tour_enum"] | null
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
          height?: number | null
          hof?: number | null
          id?: string
          last_name?: string | null
          official_link?: string | null
          pm?: number | null
          retired?: number | null
          rh?: string | null
          site_link?: string | null
          tour?: Database["public"]["Enums"]["tour_enum"] | null
          turned_pro?: number | null
          updated_at?: string
          wiki_link?: string | null
        }
        Relationships: []
      }
      retirements: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id: string
          player_id: string | null
          reason: string | null
        }
        Insert: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
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
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"] | null
          event_id: string
          id: string
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          number: number
          pm: number | null
          points: number | null
          round: Database["public"]["Enums"]["round_enum"] | null
          tour: Database["public"]["Enums"]["tour_enum"] | null
        }
        Insert: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          event_id: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          number: number
          pm?: number | null
          points?: number | null
          round?: Database["public"]["Enums"]["round_enum"] | null
          tour?: Database["public"]["Enums"]["tour_enum"] | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          event_id?: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          number?: number
          pm?: number | null
          points?: number | null
          round?: Database["public"]["Enums"]["round_enum"] | null
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
          draw: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id: string
          match_type: Database["public"]["Enums"]["match_type_enum"] | null
          rank: number | null
          seed: number | null
        }
        Insert: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          rank?: number | null
          seed?: number | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id?: string
          event_id?: string
          id?: string
          match_type?: Database["public"]["Enums"]["match_type_enum"] | null
          rank?: number | null
          seed?: number | null
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
          date: string | null
          group_name: string | null
          id: string
          loser_id: string | null
          round_id: string
          venue_id: string | null
          winner_id: string | null
        }
        Insert: {
          date?: string | null
          group_name?: string | null
          id?: string
          loser_id?: string | null
          round_id: string
          venue_id?: string | null
          winner_id?: string | null
        }
        Update: {
          date?: string | null
          group_name?: string | null
          id?: string
          loser_id?: string | null
          round_id?: string
          venue_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
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
          tours: Database["public"]["Enums"]["tour_enum"][] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          abolished?: number | null
          established?: number | null
          id: number
          name: string
          tours?: Database["public"]["Enums"]["tour_enum"][] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          abolished?: number | null
          established?: number | null
          id?: number
          name?: string
          tours?: Database["public"]["Enums"]["tour_enum"][] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          city: string
          country_id: string | null
          id: string
          name: string | null
        }
        Insert: {
          city: string
          country_id?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          city?: string
          country_id?: string | null
          id?: string
          name?: string | null
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
          draw: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id: string
          player_id: string | null
          reason: string | null
        }
        Insert: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
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
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          draw: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id: string
          player_id: string | null
          reason: string | null
        }
        Insert: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
          entry_id: string
          event_id: string
          id?: string
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          draw?: Database["public"]["Enums"]["draw_enum"] | null
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
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_country_winners: {
        Args: { tournament_id: number }
        Returns: {
          country: Json
          id: number
          year: number
        }[]
      }
      get_elimination_winners: {
        Args: { tournament_id: number }
        Returns: {
          id: number
          match_type: Database["public"]["Enums"]["match_type_enum"]
          team: Json
          tour: Database["public"]["Enums"]["tour_enum"]
          year: number
        }[]
      }
      search_people: {
        Args: { search_term: string }
        Returns: {
          first_name: string | null
          id: string
          last_name: string | null
          player_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "people"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_players: {
        Args: { search_term: string }
        Returns: {
          country: Json
          first_name: string
          id: string
          last_name: string
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
