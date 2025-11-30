export default defineEventHandler(async event => {
  const params = await readValidatedBody(event, body => eventFormSchema.parse(body))

  let query = `/* cypher */
    MATCH (ed:Edition {id: $edition})
    MERGE (e:Event:$($tour):$($level) {id: $id})
    MERGE (e)-[:EVENT_OF]->(ed)
    SET e.updated_at = date()
  `

  if (params.sponsor_name) query += ", e.sponsor_name = $sponsor_name"
  if (params.category) query += ", e.category = $category"
  if (params.currency) query += ", e.currency = $currency"
  if (params.pm) query += ", e.pm = $pm"
  if (params.tfc) query += ", e.tfc = $tfc"
  if (params.site_link) query += ", e.site_link = $site_link"
  if (params.wiki_link) query += ", e.wiki_link = $wiki_link"
  if (params.dates) query += ", e.start_date = $dates.start_date, e.end_date = $dates.end_date"
  if (params.s_draw) query += ", e.s_draw = $s_draw"
  if (params.d_draw) query += ", e.d_draw = $d_draw"
  if (params.qs_draw) query += ", e.qs_draw = $qs_draw"
  if (params.qd_draw) query += ", e.qd_draw = $qd_draw"
  if (params.s_link) query += ", e.s_link = $s_link"
  if (params.d_link) query += ", e.d_link = $d_link"
  if (params.qs_link) query += ", e.qs_link = $qs_link"
  if (params.qd_link) query += ", e.qd_link = $qd_link"

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

  if (params.supervisors?.length) {
    query += `
      WITH e
      UNWIND $supervisors AS supervisorId
      MATCH (su:Supervisor {id: supervisorId})
      MERGE (e)<-[:SUPERVISED]-(su)
    `
  }

  const { summary } = await useDriver().executeQuery(query, params)

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Event could not be created" })
  } else {
    return { ok: true }
  }
})
