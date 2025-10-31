import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    name: string
    established?: string
    abolished?: string
    website?: string
    tours: (keyof typeof TourEnum)[]
  }

  const { id, name, established, abolished, website, tours } = getQuery<QueryProps>(event)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH (t:Tournament {id: $id})
      OPTIONAL MATCH (t)-[e2:ESTABLISHED]->(e1:Year)
      OPTIONAL MATCH (t)-[a2:ABOLISHED]->(a1:Year)
      SET t.name = $name, t.website = $website, t.updated_at = date()
      CALL (t, e1, e2) {
        WHEN $established IS NOT NULL THEN {
          MATCH (y:Year {id: $established})
          CALL (*) {
            WHEN e1 IS NOT NULL AND e1.id <> y.id THEN {
              MERGE (t)-[:ESTABLISHED]->(y)
              DELETE e2
            }
          }
        }
        WHEN $established IS NULL AND e1 IS NOT NULL THEN DELETE e2
      }
      CALL (t, a1, a2) {
        WHEN $abolished IS NOT NULL THEN {
          MATCH (y:Year {id: $abolished})
          CALL (*) {
            WHEN a1 IS NOT NULL AND a1.id <> y.id THEN {
              MERGE (t)-[:ABOLISHED]->(y)
              DELETE a2
            }
          }
        }
        WHEN $abolished IS NULL AND a1 IS NOT NULL THEN DELETE a2
      }
      CALL (t) {
        WITH [x IN $tours WHERE NOT x IN labels(t)] AS add, [x IN labels(t) WHERE NOT x IN $tours AND x <> 'Tournament'] AS remove
        SET t:$(add) REMOVE t:$(remove)
      }
    `,
    {
      id: int(id),
      name: name || null,
      established: established ? int(established) : null,
      abolished: abolished ? int(abolished) : null,
      website: website || null,
      tours: tours ? (Array.isArray(tours) ? tours : [tours]) : []
    }
  )

  console.log(
    `Notifications for tournament update: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Error updating tournament"
    })
  } else {
    return { ok: true }
  }
})
