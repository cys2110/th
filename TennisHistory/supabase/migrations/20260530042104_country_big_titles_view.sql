CREATE OR REPLACE VIEW country_big_titles
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.tour,
    pem.country_id,
    ev.edition_id,
    r.match_type,
    COALESCE(ev.start_date, ed.start_date) AS start_date,
    COALESCE(ev.category, ed.category) AS category
FROM player_entry_mapping pem
JOIN players p ON p.id = pem.player_id
JOIN entries e ON e.id = pem.entry_id
JOIN matches m ON m.winner_id = e.id
JOIN rounds r ON r.id = m.round_id AND r.round = 'Final'
JOIN events ev ON ev.id = r.event_id
JOIN editions ed ON ed.id = ev.edition_id
WHERE ed.category IN ('Grand Slam', 'Olympics')
OR ev.category IN ('Finals', 'ATP Masters 1000', 'ATP World Tour Masters 1000', 'ATP Masters Series', 'Tennis Masters Series', 'ATP Super 9', 'ATP Championship Series, Single Week', 'WTA 1000', 'WTA Premier Mandatory', 'WTA Premier 5', 'WTA Tier I');