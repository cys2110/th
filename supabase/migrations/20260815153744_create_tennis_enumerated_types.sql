CREATE SCHEMA tennis;

CREATE TYPE tennis.tour_enum AS ENUM ('ATP', 'WTA', 'ITF-M', 'ITF-W');

CREATE TYPE tennis.environment_enum AS ENUM ('Indoor', 'Outdoor');

CREATE TYPE tennis.surface_enum AS ENUM ('Clay', 'Grass', 'Hard', 'Carpet');

CREATE TYPE tennis.draw_type_enum AS ENUM ('Elimination', 'Round robin', 'Country draw', 'Laver Cup', 'Davis Cup');

CREATE TYPE tennis.draw_enum AS ENUM('Main', 'Qualifying');

CREATE TYPE tennis.match_type_enum AS ENUM ('Singles', 'Doubles');

CREATE TYPE tennis.level_enum AS ENUM ('Tour', 'Challenger', 'ITF');

CREATE TYPE tennis.incomplete_enum AS ENUM ('B', 'WO', 'D', 'R');

CREATE TYPE tennis.status_enum AS ENUM ('AL', 'CO', 'JR', 'LL', 'NG', 'Q', 'PR', 'SE', 'WC');