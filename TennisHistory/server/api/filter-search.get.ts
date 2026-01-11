export default defineEventHandler(async event => {
  interface QueryProps {
    search: string
    type: "Coach" | "Country" | "Player" | "Supervisor" | "Tournament" | "Umpire" | "Venue"
  }

  const params = getQuery<QueryProps>(event)

  let query = ""

  switch (params.type) {
    case "Coach":
    case "Supervisor":
    case "Umpire":
      query = `/* cypher */
        OPTIONAL MATCH (n:$($type)) WHERE n.first_name || ' ' || n.last_name =~ '(?i).*'+ $search + '(?i).*'
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
    case "Tournament":
      query = `/* cypher */
        OPTIONAL MATCH (n:Tournament) WHERE n.name =~ '(?i).*'+ $search + '(?i).*'
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
    default:
      break
  }

  if (!query) {
    throw createError({ statusCode: 400, statusMessage: "Invalid query parameters" })
  } else {
    const { records } = await useDriver().executeQuery(query, params)

    const results = records.map(r => {
      const result = r.get("result")

      if (!result) return null

      result["value"] = params.type === "Tournament" ? result["value"].toInt() : result["value"]

      return result
    })

    return results.filter(Boolean)
  }
})
