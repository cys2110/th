import { int, isInt } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    search: string
    type: "Tournament" | "Winner" | "Country" | "Venue" | "Supervisor" | "Entry" | "Player" | "PlayerEntry" | "Coach" | "Umpire"
    id: string
    tour: string
    matchType: string
  }

  const { search, type, id, tour, matchType } = getQuery<QueryProps>(event)

  let query = ""
  const params: Record<string, any> = {
    search,
    type,
    id,
    tour,
    matchType
  }

  switch (type) {
    case "Tournament":
      query = `/* cypher */
        OPTIONAL MATCH (n:$($type)) WHERE n.name =~ '(?i).*'+ $search + '(?i).*'
        RETURN { value: n.id, label: n.name } AS result
        ORDER BY toLower(n.name)
        LIMIT 40
      `
      break
    case "Venue":
      query = `/* cypher */
        OPTIONAL MATCH (v:Venue)-[:LOCATED_IN]->(c:Country) WHERE v.name =~ '(?i).*'+ $search + '(?i).*' OR v.city =~ '(?i).*'+ $search + '(?i).*'
        RETURN CASE
          WHEN v IS NULL THEN NULL
          WHEN v.name IS NULL THEN { value: v.id, label: v.city, country: properties(c) }
          ELSE { value: v.id, label: v.name || ', ' || v.city, country: properties(c) }
        END AS result
        ORDER BY toLower(v.city), toLower(v.name)
        LIMIT 40
      `
      break
    case "Country":
      query = `/* cypher */
        OPTIONAL MATCH (n:$($type)) WHERE n.name =~ '(?i).*'+ $search + '(?i).*'
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
    case "Supervisor":
    case "Coach":
    case "Umpire":
      query = `/* cypher */
        OPTIONAL MATCH (n:$($type)) WHERE n.first_name || ' ' || n.last_name =~ '(?i).*'+ $search + '(?i).*'
        RETURN { value: n.id, label: n.first_name || ' ' || n.last_name } AS result
        ORDER BY toLower(n.last_name), toLower(n.first_name)
        LIMIT 40
      `
      break
    case "Winner":
      params.id = int(id)

      query = `/* cypher */
        OPTIONAL MATCH (t:Tournament {id: $id})<-[:EDITION_OF]-(:Edition)<-[:EVENT_OF]-(:Event)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(:Entry)<-[:ENTERED]-(p:Player)-[:REPRESENTS]->(c:Country) WHERE p.first_name || ' ' || p.last_name =~ '(?i).*'+ $search + '(?i).*'

        RETURN {
          value: p.id,
          label: p.first_name || ' ' || p.last_name,
          country: properties(c)
        } AS result
        ORDER BY toLower(p.last_name), toLower(p.first_name)
        LIMIT 40
      `
      break
    case "Entry":
      query = `/* cypher */
        OPTIONAL MATCH (p1:Player)-[:ENTERED]->(f:Entry:$($matchType) WHERE f.id STARTS WITH $id) WHERE p1.first_name || ' ' || p1.last_name =~ '(?i).*'+ $search + '(?i).*'

        CALL (f) {
          MATCH (p:Player)-[:ENTERED]->(f)
          RETURN p
        }

        WITH f.id AS id, COLLECT(DISTINCT p.first_name || ' ' || p.last_name) AS label
        RETURN {value: id, label: apoc.text.join(label, ' / ') } AS result
        ORDER BY id
        LIMIT 40
      `
      break
    case "PlayerEntry":
      query = `/* cypher */
        OPTIONAL MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[:ENTERED]->(f:Entry) WHERE f.id STARTS WITH $id AND p.first_name || ' ' || p.last_name =~ '(?i).*'+ $search + '(?i).*'
        WITH DISTINCT p, c
        ORDER BY p.last_name, p.first_name
        RETURN { value: p.id, label: p.first_name || ' ' || p.last_name, country: properties(c) } AS result
        ORDER BY toLower(p.last_name), toLower(p.first_name), p.id
        LIMIT 40
      `
      break
    default:
      break
  }

  const { records } = await useDriver().executeQuery(query, params)

  const results = records.map(r => {
    const result = r.get("result")

    if (!result) return

    result["value"] = type === "Tournament" ? (isInt(result["value"]) ? result["value"].toInt() : result["value"]) : result["value"]

    return result
  })

  return results.filter(Boolean)
})
