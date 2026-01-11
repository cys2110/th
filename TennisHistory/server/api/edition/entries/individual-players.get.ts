import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery<{ edId: string }>(event)

    const query = `/* cypher */
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[:ENTERED]->(:Entry)-[:SCORED]->(:Score)-[:SCORED]->(:Match)-[:PLAYED]->(:Round)-[:ROUND_OF]->(e:Event:ATP)-[:EVENT_OF]->(ed:Edition {id: $edId})

      WITH DISTINCT c, p, coalesce(e.start_date, ed.start_date) AS start_date

      OPTIONAL MATCH (p)-[z:REPRESENTED]->(c1:Country) WHERE z.start_date <= start_date AND z.end_date >= start_date

      WITH p, coalesce(properties(c1), properties(c)) AS country
      ORDER BY toLower(p.last_name), toLower(p.first_name), p.id

      RETURN { value: p.id, label: p.first_name || ' ' || p.last_name, icon: country } AS result
    `

    const { records } = await useDriver().executeQuery(query, { edId: int(edId) })

    const results = records.map(record => record.get("result"))

    return results as Array<{ value: string | number; label: string; icon: CountryType }>
  } catch (error) {
    throw error
  }
})
