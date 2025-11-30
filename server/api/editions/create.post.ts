export default defineEventHandler(async event => {
  // const body = await readBody(event)
  // try {
  //   editionFormSchema.parse(body)
  // } catch (e) {
  //   console.error(e.issues)
  // }

  const params = await readValidatedBody(event, body => editionFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (t:Tournament {id: $tournament})
    MATCH (y:Year {id: $year})
    MERGE (e:Edition:$($tours) {id: $id})
    MERGE (e)-[:EDITION_OF]->(t)
    MERGE (e)-[:IN_YEAR]->(y)
    SET e.updated_at = date()
  `

  if (params.sponsor_name) query += ", e.sponsor_name = $sponsor_name"
  if (params.category) query += ", e.category = $category"
  if (params.currency) query += ", e.currency = $currency"
  if (params.tfc) query += ", e.tfc = $tfc"
  if (params.wiki_link) query += ", e.wiki_link = $wiki_link"
  if (params.draw_type) query += ", e.draw_type = $draw_type"
  if (params.draw_link) query += ", e.draw_link = $draw_link"
  if (params.dates) query += ", e.start_date = $dates.start, e.end_date = $dates.end"

  if (params.surface) {
    query += `
      WITH e
      MATCH (s:Surface {id: $surface})
      MERGE (e)-[:ON_SURFACE]->(s)
    `
  }

  if (params.venues?.length) {
    query += `
      WITH e
      UNWIND $venues AS venueId
      MATCH (v:Venue {id: venueId})
      MERGE (e)-[:TOOK_PLACE_IN]->(v)
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Edition could not be created" })
  } else {
    return { ok: true }
  }
})
