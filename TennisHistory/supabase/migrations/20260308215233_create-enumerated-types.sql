-- Tour enum type
CREATE TYPE tour_enum AS ENUM ('ATP', 'WTA', 'ITF-M', 'ITF-W');

-- Currency enum type
CREATE TYPE currency_enum AS ENUM ('AUD', 'EUR', 'FRF', 'GBP', 'USD');

-- Continent enum type
CREATE TYPE continent_enum AS ENUM ('Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America');

-- Environment enum type
CREATE TYPE environment_enum AS ENUM ('Indoor', 'Outdoor');

-- Surfaace enum type
CREATE TYPE surface_enum AS ENUM ('Clay', 'Grass', 'Hard', 'Carpet');

-- Draws enum type
CREATE TYPE draws_enum AS ENUM ('Round of 128', 'Round of 64', 'Round of 48', 'Round of 32', 'Round of 28', 'Round of 24', 'Round of 16', 'Round of 8', 'Round of 4', 'Round robin', 'Country draw', 'Laver Cup');

-- Draw enum type
CREATE TYPE draw_enum AS enum('Main', 'Qualifying');

-- Match type enum
CREATE TYPE match_type_enum AS ENUM ('Singles', 'Doubles');

-- Level enum type
CREATE TYPE level_enum AS ENUM ('Tour', 'Challenger', 'ITF');

-- Incomplete enum type
CREATE TYPE incomplete_enum AS ENUM ('B', 'WO', 'D', 'R');

-- Status enum type
CREATE TYPE status_enum AS ENUM ('AL', 'CO', 'JR', 'LL', 'NG', 'Q', 'PR', 'SE', 'WC');

-- Round enum type
CREATE TYPE round_enum AS ENUM ('Day 1', 'Day 2', 'Day 3', 'Participation', 'Alternate', 'Group stage', 'Round robin', 'Qualifying round 1', 'Qualifying round 2', 'Qualifying round 3', 'Final', 'Semifinals', 'Quarterfinals', 'Qualifier', 'Round of 128', 'Round of 64', 'Round of 32', 'Round of 16', 'Win', 'Bronze Medal Match', '3rd Place Match');