export default defineEventHandler(async event => {
  const { id } = getQuery(event)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (p:Player {id: $id})
      OPTIONAL MATCH (p)-[t:REPRESENTS]->(c:Country)
      OPTIONAL MATCH (p)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(:Event)-[:EVENT_OF]->(:Edition)-[:IN_YEAR]->(y:Year)
      WITH *
      ORDER BY y.id
      WITH p, properties(c) AS country, COLLECT(DISTINCT y.id) AS years
      RETURN apoc.map.clean(
        apoc.map.merge(
          apoc.map.submap(
            p,
            ['id', 'first_name', 'last_name', "official_link", "site_link", "wiki_link"],
            null,
            false
          ),
          {
            tour: [x IN labels(p) WHERE x IN ['ATP', 'WTA']][0],
            country: country,
            years: years
          }
        ),
        [],
        [null]
      ) AS player
    `,
    { id }
  )

  const player = records[0].get("player")

  return playerOverviewSchema.parse(player)
})
