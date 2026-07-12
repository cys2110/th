DROP FUNCTION IF EXISTS get_activity_options(TEXT);

CREATE OR REPLACE FUNCTION get_activity_options(player_id TEXT)
RETURNS TABLE (
    categories TEXT[],
    tournaments jsonb[]
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
WITH options AS (
  SELECT
    pt.id,
    pt.name,
    a.category
  FROM activity a
  JOIN tournaments pt ON pt.id = a.tournament_id
  WHERE a.player_id = get_activity_options.player_id
),
categories AS (
  SELECT DISTINCT category
  FROM options
),
tournaments AS (
  SELECT DISTINCT id, name
  FROM options
)

SELECT
  ARRAY(SELECT c.category FROM categories c ORDER BY c.category) AS categories,
  ARRAY(
    SELECT jsonb_build_object(
      'id', t.id,
      'name', t.name
    )
    FROM tournaments t
    ORDER BY t.name
  ) AS tournaments;
END;
$$;
