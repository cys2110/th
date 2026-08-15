ALTER TABLE football.match_award
DROP CONSTRAINT match_award_has_recipient,
ADD CONSTRAINT match_award_has_recipient
CHECK (num_nonnulls(player_id, team_id) >= 1);