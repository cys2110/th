export default defineEventHandler(async query => {
  const { records } = await useDriver().executeQuery(
    `/* cypher */
      MATCH (u:Umpire)
      MATCH (v:Umpire) WHERE u.id <> v.id AND apoc.text.compareCleaned(u.id, v.id)
      RETURN {umpire1: u.id, umpire2: v.id} AS result
      LIMIT 40
    `
  )

  const results = records.map(record => record.get("result"))

  return results as { umpire1: string; umpire2: string }[]
})
