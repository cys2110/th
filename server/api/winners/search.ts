import { int } from "neo4j-driver"

export default defineEventHandler(async query => {
  interface QueryProps {
    search: string
    id: string
  }

  const { search, id } = getQuery<QueryProps>(query)

  const { records } = await useDriver().executeQuery(
    `/* cypher */
      OPTIONAL MATCH (t:Tournament {id: $id})<-[:EDITION_OF]-(:Edition)<-[:EVENT_OF]-(:Event)<-[:ROUND_OF]-(:Round {round: 'Final'})<-[:PLAYED]-(:Match)<-[:SCORED]-(:Winner)<-[:SCORED]-(:Entry)<-[:ENTERED]-(p:Player) WHERE p.first_name || ' ' || p.last_name =~ '(?i).*'+ $search + '(?i).*'
      RETURN apoc.map.submap(p, ['id', 'first_name', 'last_name']) AS player
      ORDER BY p.last_name, p.first_name
      LIMIT 40
    `,
    { search, id: int(id) }
  )

  const results = records.map(r => {
    const player = r.get("player")
    return { value: player.id, label: `${player.first_name} ${player.last_name}` }
  })

  return results
})
