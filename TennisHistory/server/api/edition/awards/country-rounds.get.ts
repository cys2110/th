import { int } from "neo4j-driver"

export default defineEventHandler(async event => {
  try {
    const { edId } = getQuery<{ edId: string }>(event)

    const query = `/* cypher */
      MATCH (:Edition {id: $edId})<-[:EVENT_OF]-(:Event)<-[:ROUND_OF]-(r:Round)
      WITH r ORDER BY r.number

      RETURN {
        value: r.id,
        label: CASE WHEN r.round = 'Group stage' THEN r.round || ' ' || r.group ELSE r.round END
      } AS result
    `

    const { records } = await useDriver().executeQuery(query, { edId: int(edId) })

    return records.map(r => r.get("result"))
  } catch (error) {
    throw error
  }
})
