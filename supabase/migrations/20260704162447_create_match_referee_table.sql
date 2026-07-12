CREATE TYPE football.referee_type AS ENUM ('referee', 'assistant_referee', 'fourth_official', 'reserve_assistance_referee', 'var_referee', 'assistant_var_referee', 'support_video_assistant_referee');

CREATE TYPE football.match_award_type AS ENUM ('man_of_the_match', 'player_of_the_match');

CREATE TABLE football.match_referee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES football.people (id) ON UPDATE CASCADE ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES football.match (id) ON UPDATE CASCADE ON DELETE CASCADE,
    type football.referee_type NOT NULL,

    UNIQUE (person_id, match_id)
);

CREATE TABLE football.match_award (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES football.match (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    player_id UUID REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    type football.match_award_type NOT NULL,
    source TEXT,

    UNIQUE (match_id, type, source)
);