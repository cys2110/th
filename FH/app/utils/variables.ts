import { type Enums } from "~/types/database.types"

type TeamType = Enums<{ schema: "football" }, "team_type">
type CompetitionType = Enums<{ schema: "football" }, "competition_type">
type CompetitionCategory = Enums<{ schema: "football" }, "competition_category">
type CoachRole = Enums<{ schema: "football" }, "coach_role">
type AffiliationType = Enums<{ schema: "football" }, "na_affiliation_type">
type PreferredFoot = Enums<{ schema: "football" }, "preferred_foot">
type PlayerTeamRelationshipType = Enums<{ schema: "football" }, "player_team_relationship_type">
type PositionGroup = Enums<{ schema: "football" }, "position_group">
type StageType = Enums<{ schema: "football" }, "stage_type">
type MatchStatus = Enums<{ schema: "football" }, "match_status">
type MatchDecision = Enums<{ schema: "football" }, "match_decision">
type MatchEventType = Enums<{ schema: "football" }, "match_event_type">
type MatchEventRole = Enums<{ schema: "football" }, "match_event_role">
type RefereeType = Enums<{ schema: "football" }, "referee_type">
type MatchAwardType = Enums<{ schema: "football" }, "match_award_type">
type GoalExecution = Enums<{ schema: "football" }, "goal_execution">
type GoalSituation = Enums<{ schema: "football" }, "goal_situation">

export const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]

export const POSITION_GROUP_MAPPING: Record<PositionGroup, string> = {
  goalkeeper: "Goalkeeper",
  defender: "Defender",
  midfielder: "Midfielder",
  forward: "Forward"
}
export const POSITION_GROUPS = Object.entries(POSITION_GROUP_MAPPING).map(([key, value]) => ({ label: value, value: key }))

export const STAGE_TYPE_MAPPING: Record<StageType, string> = {
  group: "Group",
  knockout: "Knockout",
  league: "League"
}

export const MATCH_STATUS_MAPPING: Record<MatchStatus, string> = {
  scheduled: "Scheduled",
  full_time: "Full Time",
  cancelled: "Cancelled",
  postponed: "Postponed",
  abandoned: "Abandoned"
}

export const MATCH_DECISION_MAPPING: Record<MatchDecision, string> = {
  normal: "Normal Time",
  extra_time: "Extra Time",
  penalties: "Penalties",
  walkover: "Walkover",
  awarded: "Awarded"
}

export const MATCH_EVENT_TYPE_MAPPING: Record<MatchEventType, string> = {
  goal: "Goal",
  yellow_card: "Yellow Card",
  red_card: "Red Card",
  second_yellow_card: "Second Yellow Card",
  penalty_missed: "Penalty Missed",
  penalty_saved: "Penalty Saved",
  own_goal: "Own Goal",
  substitution: "Substitution",
  injury: "Injury"
}

export const MATCH_EVENT_ROLE_MAPPING: Record<MatchEventRole, string> = {
  scorer: "Scorer",
  assist: "Assist",
  sub_on: "Sub On",
  sub_off: "Sub Off",
  carded_player: "Carded Player",
  fouled_player: "Fouled Player",
  committed_by: "Committed By",
  own_goal_scorer: "Own Goal Scorer",
  penalty_taker: "Penalty Taker",
  penalty_won_by: "Penalty Won By",
  penalty_conceded_by: "Penalty Conceded By",
  keeper: "Keeper",
  injured_player: "Injured Player"
}

export const REFEREE_TYPE_MAPPING: Record<RefereeType, string> = {
  referee: "Referee",
  assistant_referee: "Assistant Referee",
  fourth_official: "Fourth Official",
  reserve_assistance_referee: "Reserve Assistant Referee",
  var_referee: "Video Assistant Referee",
  assistant_var_referee: "Assistant Video Assistant Referee",
  support_video_assistant_referee: "Support Video Assistant Referee"
}

export const MATCH_AWARD_TYPE_MAPPING: Record<MatchAwardType, string> = {
  man_of_the_match: "Man of the Match",
  player_of_the_match: "Player of the Match"
}

export const GOAL_EXECUTION_MAPPING: Record<GoalExecution, string> = {
  tap_in: "Tap In",
  header: "Header",
  volley: "Volley",
  half_volley: "Half Volley",
  chip_lob: "Chip/Lob",
  bicycle_kick: "Bicycle Kick",
  curler: "Curler",
  backheel: "Backheel",
  deflection: "Deflection",
  own_goal: "Own Goal",
  unknown: "Unknown"
}

export const GOAL_SITUATION_MAPPING: Record<GoalSituation, string> = {
  open_play: "Open Play",
  penalty: "Penalty",
  direct_free_kick: "Direct Free Kick",
  indirect_free_kick: "Indirect Free Kick",
  corner: "Corner",
  olympic_goal: "Olympic Goal",
  own_goal: "Own Goal",
  counter_attack: "Counter Attack",
  unknown: "Unknown"
}

export const TEAM_TYPE_MAPPING: Record<TeamType, string> = {
  club: "Club",
  national_team: "National",
  representative_team: "Representative"
}

export const COMPETITION_TYPE_MAPPING: Record<CompetitionType, string> = {
  league: "League",
  cup: "Cup",
  friendly: "Friendly",
  playoff: "Playoff",
  super_cup: "Super Cup",
  tournament: "Tournament"
}

export const COMPETITION_CATEGORY_MAPPING: Record<CompetitionCategory, string> = {
  domestic: "Domestic",
  continental: "Continental",
  international: "International"
}

export const AFFILIATION_TYPE_MAPPING: Record<AffiliationType, string> = {
  birth: "Birth",
  nationality: "Nationality",
  player_allegiance: "Player Allegiance",
  coach_appointment: "Coach Appointment"
}

export const COACH_ROLE_MAPPING: Record<CoachRole, string> = {
  manager: "Manager",
  head_coach: "Head Coach",
  caretaker: "Caretaker Coach",
  assistant_coach: "Assistant Coach",
  goalkeeping_coach: "Goalkeeping Coach"
}

export const PREFERRED_FOOT_MAPPING: Record<PreferredFoot, string> = {
  right: "Right",
  left: "Left"
}

export const PLAYER_TEAM_RELATIONSHIP_TYPE_MAPPING: Record<PlayerTeamRelationshipType, string> = {
  permanent: "Permanent",
  loan: "Loan",
  reserve: "Reserve"
}

export const PENALTY_OUTCOME_MAPPING = {
  scored: "Scored",
  saved: "Saved",
  missed: "Missed",
  post: "Post",
  crossbar: "Crossbar"
}
