import { z } from "zod"

export const TeamTypeEnum = z.enum(
  ["club", "national_team", "representative_team"],
  `Team type must be one of ${["club", "national_team", "representative_team"].join(", ")}`
)

export const AffiliationTypeEnum = z.enum(
  ["player_allegiance", "coach_appointment"],
  `Affiliation type must be one of ${["player_allegiance", "coach_appointment"].join(", ")}`
)

export const CoachRoleEnum = z.enum(
  ["manager", "head_coach", "caretaker", "assistant_coach", "goalkeeping_coach"],
  `Coach role must be one of ${["manager", "head_coach", "caretaker", "assistant_coach", "goalkeeping_coach"].join(", ")}`
)

export const PreferredFootEnum = z.enum(["right", "left"], `Preferred foot must be one of ${["right", "left"].join(", ")}`)

export const PlayerTeamRelationshipEnum = z.enum(
  ["permanent", "loan", "reserve"],
  `Player team relationship must be one of ${["permanent", "loan", "reserve"].join(", ")}`
)

export const StageTypeEnum = z.enum(["group", "knockout", "league"], `Stage type must be one of ${["group", "knockout", "league"].join(", ")}`)

export const MatchStatusEnum = z.enum(
  ["scheduled", "full_time", "cancelled", "postponed", "abandoned"],
  `Match status must be one of ${["scheduled", "full_time", "completed", "cancelled", "postponed", "abandoned"].join(", ")}`
)

export const MatchDecisionEnum = z.enum(
  ["normal", "extra_time", "penalties", "walkover", "awarded"],
  `Match decision must be one of ${["normal", "extra_time", "penalties", "walkover", "awarded"].join(", ")}`
)

export const MatchEventType = z.enum(
  ["goal", "red_card", "yellow_card", "second_yellow_card", "penalty_missed", "penalty_saved", "own_goal", "substitution", "injury"],
  `Match event type must be one of ${["goal", "red_card", "yellow_card", "second_yellow_card", "penalty_missed", "penalty_saved", "own_goal", "substitution", "injury"].join(", ")}`
)

export const MatchEventRole = z.enum(
  [
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
    "injured_player"
  ],
  `Match event role must be one of ${["scorer", "assist", "sub_on", "sub_off", "carded_player", "fouled_player", "committed_by", "own_goal_scorer", "penalty_taker", "penalty_won_by", "penalty_conceded_by", "keeper", "injured_player"].join(", ")}`
)

export const RefereeType = z.enum(
  [
    "referee",
    "assistant_referee",
    "fourth_official",
    "reserve_assistance_referee",
    "var_referee",
    "assistant_var_referee",
    "support_video_assistant_referee"
  ],
  `Referee type must be one of ${["referee", "assistant_referee", "fourth_official", "reserve_assistance_referee", "var_referee", "assistant_var_referee", "support_video_assistant_referre"].join(", ")}`
)

export const MatchAwardTypeEnum = z.enum(
  ["man_of_the_match", "player_of_the_match"],
  `Match award type must be one of ${["man_of_the_match", "player_of_the_match"].join(", ")}`
)

export const GoalExecutionEnum = z.enum(
  ["tap_in", "header", "volley", "half_volley", "chip_lob", "bicycle_kick", "curler", "backheel", "deflection", "own_goal", "unknown"],
  `Goal execution must be one of ${["tap_in", "header", "volley", "half_volley", "chip_lob", "bicycle_kick", "curler", "backheel", "deflection", "own_goal", "unknown"].join(", ")}`
)

export const GoalSituationEnum = z.enum(
  ["open_play", "penalty", "direct_free_kick", "indirect_free_kick", "corner", "olympic_goal", "own_goal", "counter_attack", "unknown"],
  `Goal situation must be one of ${["open_play", "penalty", "direct_free_kick", "indirect_free_kick", "corner", "olympic_goal", "own_goal", "counter_attack", "unknown"].join(", ")}`
)

export const PositionGroupEnum = z.enum(
  ["goalkeeper", "defender", "midfielder", "forward"],
  `Position group must be one of ${["goalkeeper", "defender", "midfielder", "forward"].join(", ")}`
)
