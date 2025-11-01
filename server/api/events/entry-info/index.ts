export default defineEventHandler(async event => {
  const { edId, tour } = getQuery(event)

  const { records, summary } = await useDriver().executeQuery(
    `/* cypher */
    OPTIONAL MATCH (f:Entry)-[t]->(e:Event {id: $id})-[:EVENT_OF]->(ed:Edition) WHERE NOT type(t) IN ['SEEDED', 'Q_SEEDED']
    CALL (f, e, ed) {
      MATCH (c:Country)<-[:REPRESENTS]-(p:Player)-[:ENTERED]->(f)
      OPTIONAL MATCH (p)-[z:REPRESENTED WHERE z.start_date <= coalesce(e.start_date, ed.start_date) AND z.end_date > coalesce(e.start_date, ed.start_date)]->(c1:Country)
      WITH p, CASE WHEN z IS NULL THEN properties(c) ELSE properties(c1) END AS country
      RETURN COLLECT(DISTINCT apoc.map.merge(apoc.map.submap(p, ['id', 'first_name', 'last_name'], null, false), {country: country})) AS team
    }
    WITH t, CASE WHEN f:Singles THEN 'Singles' ELSE 'Doubles' END AS type, TYPE(t) AS relationship, properties(t) AS properties, properties(f) AS entry, team
    RETURN CASE WHEN t IS NULL THEN NULL ELSE apoc.map.mergeList([
      properties,
      entry,
      {
        team: team,
        type: type,
        relationship: relationship
      }
    ]) END AS result
    `,
    { id: `${edId}-${tour}` }
  )

  console.log(
    `Notifications for entry info: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  const getRelationship = (type: string) => {
    switch (type) {
      case "LUCKY_LOSER":
        return "Lucky Loser"
      case "ALTERNATE":
      case "Q_ALTERNATE":
        return "Alternate"
      case "DEFAULTED":
      case "Q_DEFAULTED":
        return "Default"
      case "QUALIFIED":
        return "Qualifier"
      case "LDA":
      case "Q_LDA":
        return "Last Direct Acceptance"
      case "WILD_CARD":
      case "Q_WILD_CARD":
        return "Wild Card"
      case "WITHDREW":
      case "Q_WITHDREW":
        return "Withdrawal"
      case "RETIRED":
      case "Q_RETIRED":
        return "Retirement"
      default:
        return "Walkover"
    }
  }

  const getDraw = (type: string) => {
    switch (type) {
      case "Q_ALTERNATE":
      case "Q_DEFAULTED":
      case "Q_LDA":
      case "Q_WILD_CARD":
      case "Q_WITHDREW":
      case "Q_RETIRED":
        return "Qualifying"
      default:
        return "Main"
    }
  }

  const results = records.map(record => {
    const result = record.get("result")
    if (!result) return null
    if (result?.["rank"]) result["rank"] = result["rank"].toInt()
    result["draw"] = getDraw(result["relationship"])
    result["relationship"] = getRelationship(result["relationship"])
    return result
  })

  return results.filter(Boolean)
})
