export default defineEventHandler(async query => {
  const { type, id1, id2 } = getQuery(query)
  const type2 = type === "Coach" ? "Player" : "Umpire"

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (v:$($type) {id: $id1})
      MATCH (d:$($type2) {id: $id2})
      WITH head(collect([v, d])) AS nodes
      CALL apoc.refactor.mergeNodes(nodes, {
        mergeRels: true
      })
      YIELD node
      RETURN node
    `,
    { type, type2, id1, id2 }
  )

  return summary
})
