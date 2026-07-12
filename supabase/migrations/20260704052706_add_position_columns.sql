ALTER TABLE football.player
ADD COLUMN current_position football.position_group;

ALTER TABLE football.squad_player
ADD COLUMN position football.position_group;

UPDATE football.player
SET current_position = (CASE
    WHEN current_position_id = 'GK' THEN 'goalkeeper'
    WHEN current_position_id IN ('RB', 'CB', 'LB', 'SW', 'RWB', 'LWB', 'DF')
        THEN 'defender'
    WHEN current_position_id IN ('CDM', 'CM', 'CAM', 'LM', 'RM', 'MF')
        THEN 'midfielder'
    WHEN current_position_id IN ('RW', 'LW', 'CF', 'SS', 'ST', 'FW')
        THEN 'forward'
    ELSE NULL
END)::football.position_group;;

UPDATE football.squad_player
SET position = (CASE
    WHEN position_id = 'GK' THEN 'goalkeeper'
    WHEN position_id IN ('RB', 'CB', 'LB', 'SW', 'RWB', 'LWB', 'DF')
        THEN 'defender'
    WHEN position_id IN ('CDM', 'CM', 'CAM', 'LM', 'RM', 'MF')
        THEN 'midfielder'
    WHEN position_id IN ('RW', 'LW', 'CF', 'SS', 'ST', 'FW')
        THEN 'forward'
    ELSE NULL
END)::football.position_group;;

ALTER TABLE football.player
DROP COLUMN current_position_id;

ALTER TABLE football.squad_player
DROP COLUMN position_id;