export default defineEventHandler(async event => {
  try {
    const params = getQuery(event)

    const { summary } = await useDriver().executeQuery("MERGE (p:Player:$($tour) {id: $id})", params)

    if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      return {
        success: false,
        error: `Player ${params.id} could not be created`
      }
    } else {
      return { success: true }
    }
  } catch (error) {
    throw error
  }
})
