export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => editionFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (e:Edition {id: $id})
    SET e.updated_at = date()
  `

  if ("sponsor_name" in params) {
    query += ", e.sponsor_name = $sponsor_name"
  }

  if ("category" in params) {
    query += ", e.category = $category"
  }

  if ("currency" in params) {
    query += ", e.currency = $currency"
  }

  if ("tfc" in params) {
    query += ", e.tfc = $tfc"
  }

  if ("wiki_link" in params) {
    query += ", e.wiki_link = $wiki_link"
  }

  if ("draw_type" in params) {
    query += ", e.draw_type = $draw_type"
  }

  if ("draw_link" in params) {
    query += ", e.draw_link = $draw_link"
  }

  if ("dates" in params) {
    query += ", e.start_date = $dates.start, e.end_date = $dates.end"
  }

  if ("surface" in params) {
    query += `
      WITH e
      OPTIONAL MATCH (e)-[s1:ON_SURFACE]->(:Surface)
      DELETE s1
    `

    if (params.surface) {
      query += `
      WITH e
      MATCH (s:Surface {id: $surface})
      MERGE (e)-[:ON_SURFACE]->(s)
    `
    }
  }

  if ("venues" in params) {
    query += `
      WITH e
      OPTIONAL MATCH (e)-[v1:TOOK_PLACE_IN]->(:Venue)
      DELETE v1
    `

    if (params.venues?.length) {
      query += `
      WITH e
      UNWIND $venues AS venueId
      MATCH (v:Venue {id: venueId})
      MERGE (e)-[:TOOK_PLACE_IN]->(v)
    `
    }
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Edition could not be updated" })
  } else {
    return { ok: true }
  }
})
