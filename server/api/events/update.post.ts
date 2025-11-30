export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => eventFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (e:Event {id: $id})
    SET e.updated_at = date()
  `

  if ("sponsor_name" in params) query += ", e.sponsor_name = $sponsor_name"
  if ("category" in params) query += ", e.category = $category"
  if ("currency" in params) query += ", e.currency = $currency"
  if ("pm" in params) query += ", e.pm = $pm"
  if ("tfc" in params) query += ", e.tfc = $tfc"
  if ("site_link" in params) query += ", e.site_link = $site_link"
  if ("wiki_link" in params) query += ", e.wiki_link = $wiki_link"
  if ("dates" in params) query += ", e.start_date = $dates.start_date, e.end_date = $dates.end_date"
  if ("s_draw" in params) query += ", e.s_draw = $s_draw"
  if ("d_draw" in params) query += ", e.d_draw = $d_draw"
  if ("qs_draw" in params) query += ", e.qs_draw = $qs_draw"
  if ("qd_draw" in params) query += ", e.qd_draw = $qd_draw"
  if ("s_link" in params) query += ", e.s_link = $s_link"
  if ("d_link" in params) query += ", e.d_link = $d_link"
  if ("qs_link" in params) query += ", e.qs_link = $qs_link"
  if ("qd_link" in params) query += ", e.qd_link = $qd_link"

  if ("surface" in params) {
    query += `
      WITH e
      OPTIONAL MATCH (e)-[os:ON_SURFACE]->(s:Surface)
      DELETE os
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
      OPTIONAL MATCH (e)-[ov:AT_VENUE]->(v:Venue)
      DELETE ov
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

  if ("supervisors" in params) {
    query += `
      WITH e
      OPTIONAL MATCH (e)<-[os:SUPERVISED]-(su:Supervisor)
      DELETE os
    `
    if (params.supervisors?.length) {
      query += `
        WITH e
        UNWIND $supervisors AS supervisorId
        MATCH (su:Supervisor {id: supervisorId})
        MERGE (e)<-[:SUPERVISED]-(su)
      `
    }
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Event could not be updated" })
  } else {
    return { ok: true }
  }
})
