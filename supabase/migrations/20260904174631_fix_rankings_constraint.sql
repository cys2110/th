ALTER TABLE tennis.rankings
DROP CONSTRAINT rankings_rank_check;

ALTER TABLE tennis.rankings
ADD CONSTRAINT rankings_rank_check CHECK (rank >= 0);