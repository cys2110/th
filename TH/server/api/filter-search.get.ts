

import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    search: string
    type: "Coach" | "Country" | "Player"
  }

  const params = getQuery<QueryProps>(event)

  let query = ""

  switch (params.type) {
    case "Coach":
      query = `/* cypher */
        OPTIONAL MATCH (n:Coach) WHERE n.first_name || ' ' || n.last_name =~ '(?i).*'+ $search + '(?i).*'
        RETURN { value: n.id, label: n.first_name || ' ' || n.last_name } AS result
        ORDER BY toLower(n.last_name), toLower(n.first_name)
        LIMIT 40
      `
      break
    case "Country":
      query = `/* cypher */
        OPTIONAL MATCH (n:Country) WHERE n.name =~ '(?i).*'+ $search + '(?i).*'
        RETURN { value: n.id, label: n.name, country: properties(n) } AS result
        ORDER BY toLower(n.name)
        LIMIT 40
      `
      break
    case "Player":
      query = `/* cypher */
        OPTIONAL MATCH (p:Player)-[:REPRESENTS]->(c:Country) WHERE p.first_name + ' ' + p.last_name =~ '(?i).*'+ $search + '(?i).*'
        RETURN {
          value: p.id,
          label: p.first_name || ' ' || p.last_name,
          country: properties(c)
        } AS result
        ORDER BY toLower(p.last_name), toLower(p.first_name), p.id
        LIMIT 40
      `
      break
    default:
      break
  }

  if (!query) {
    return []
  } else {
    const { records } = await useDriver().executeQuery(query, params)

    const results = records.map(record => {
      const result = record.get("result")

      if (!result) return null

      // result["value"] = type === "Tournament" ? result["value"].toInt() : result["value"]

      return result
    })

    return results.filter(Boolean)
  }
})
