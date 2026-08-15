CREATE SCHEMA football;

CREATE TYPE football.competition_type AS ENUM ('league', 'cup', 'playoff', 'super_cup', 'friendly', 'tournament');

CREATE TYPE football.competition_category AS ENUM ('domestic', 'continental', 'international');

CREATE TYPE football.team_type AS ENUM ('club', 'national_team', 'representative_team');

CREATE TYPE football.na_affiliation_type AS ENUM ('birth', 'nationality', 'player_allegiance', 'coach_appointment');

CREATE TYPE football.position_group AS ENUM ('goalkeeper', 'defender', 'midfielder', 'forward');

CREATE TYPE football.coach_role AS ENUM ('manager', 'head_coach', 'caretaker', 'assistant_coach', 'goalkeeping_coach');

CREATE TYPE football.player_team_relationship_type AS ENUM('permanent', 'loan', 'reserve');

CREATE TYPE football.stage_type AS ENUM ('group', 'knockout', 'league');

CREATE TYPE football.match_status AS ENUM ('scheduled', 'full_time', 'cancelled', 'postponed', 'abandoned');

CREATE TYPE football.match_decision AS ENUM ('normal', 'extra_time', 'penalties', 'walkover', 'awarded');

CREATE TYPE football.match_event_type AS ENUM ('goal', 'save', 'red_card', 'yellow_card', 'second_yellow_card', 'penalty_missed', 'penalty_saved', 'substitution', 'injury');

CREATE TYPE football.match_event_role AS ENUM ('scorer', 'assist', 'sub_on', 'sub_off', 'carded_player', 'fouled_player', 'committed_by', 'own_goal_scorer', 'penalty_taker', 'penalty_won_by', 'penalty_conceded_by', 'keeper', 'injured_player');

CREATE TYPE football.preferred_foot AS ENUM('left', 'right');

CREATE TYPE football.referee_type AS ENUM ('referee', 'assistant_referee', 'fourth_official', 'reserve_assistant_referee', 'var', 'assistant_var', 'support_var');

CREATE TYPE football.match_award_type AS ENUM ('man_of_the_match', 'player_of_the_match');

CREATE TYPE football.goal_execution AS ENUM('tap_in', 'header', 'volley', 'half_volley', 'chip_lob', 'bicycle_kick', 'curler', 'backheel', 'deflection', 'long_range', 'own_goal', 'unknown');

CREATE TYPE football.goal_situation AS ENUM('open_play', 'penalty', 'direct_free_kick', 'indirect_free_kick', 'corner', 'olympic_goal', 'own_goal', 'counter_attack', 'unknown');