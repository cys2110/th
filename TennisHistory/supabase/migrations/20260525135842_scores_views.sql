CREATE OR REPLACE VIEW scores_by_winner AS
SELECT
    ws.match_id,
    ws.entry_id AS t1_id,
    ls.entry_id AS t2_id,
    ws.set_no,
    ws.set AS t1_set,
    ls.set AS t2_set,
    ws.tb AS t1_tb,
    ls.tb AS t2_tb
FROM matches m
LEFT JOIN match_scores ws ON ws.match_id = m.id AND ws.entry_id = m.winner_id
LEFT JOIN match_scores ls ON ls.match_id = m.id AND ls.entry_id = m.loser_id AND ws.set_no = ls.set_no;

CREATE OR REPLACE VIEW scores_by_teams AS
SELECT
    t1.match_id,
    t1.entry_id AS t1_id,
    t2.entry_id AS t2_id,
    t1.set_no,
    t1.set AS t1_set,
    t2.set AS t2_set,
    t1.tb AS t1_tb,
    t2.tb AS t2_tb
FROM matches m
LEFT JOIN match_scores t1 ON t1.match_id = m.id AND t1.entry_id = m.team_1_id
LEFT JOIN match_scores t2 ON t2.match_id = m.id AND t2.entry_id = m.team_2_id AND t1.set_no = t2.set_no;