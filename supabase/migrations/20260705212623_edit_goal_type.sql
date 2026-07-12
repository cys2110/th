CREATE TYPE football.goal_execution AS ENUM('tap_in', 'header', 'volley', 'half_volley', 'chip_lob', 'bicycle_kick', 'curler', 'backheel', 'deflection', 'own_goal', 'unknown');

CREATE TYPE football.goal_situation AS ENUM('open_play', 'penalty', 'direct_free_kick', 'indirect_free_kick', 'corner', 'olympic_goal', 'own_goal', 'counter_attack', 'unknown');

ALTER TABLE football.match_event
ADD COLUMN goal_execution football.goal_execution,
ADD COLUMN goal_situation football.goal_situation;

-- Backfill data before dropping column
UPDATE football.match_event
SET goal_execution = 'unknown'::football.goal_execution,
    goal_situation = (CASE
        WHEN goal_type::text = 'set_piece' THEN 'unknown'
        WHEN goal_type::text = 'close_range_finish' THEN 'open_play'
        ELSE goal_type::text
    END)::football.goal_situation
WHERE type = 'goal' AND goal_type IS NOT NULL;

ALTER TABLE football.match_event

ADD CONSTRAINT match_event_goal_details_check
CHECK (
  (
    type = 'goal'
    AND goal_execution IS NOT NULL
    AND goal_situation IS NOT NULL
  )
  OR
  (
    type <> 'goal'
    AND goal_execution IS NULL
    AND goal_situation IS NULL
  )
);

ALTER TABLE football.match_event
DROP COLUMN goal_type;

DROP TYPE football.goal_type;