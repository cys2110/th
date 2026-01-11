import { ZodError } from "zod"

export default defineEventHandler(async event => {
  try {
    const params = await readValidatedBody(event, body => entryInfoFormSchema.parse(body))

    let query = `/* cypher */
      CYPHER 25
      WITH
      CASE
        WHEN $draw = 'Main' AND $relationship = 'Default' THEN 'DEFAULTED'
        WHEN $draw = 'Main' AND $relationship = 'Retirement' THEN 'RETIRED'
        WHEN $draw = 'Main' AND $relationship = 'Walkover' THEN 'WALKOVER'
        WHEN $draw = 'Main' AND $relationship = 'Withdrawal' THEN 'WITHDREW'
        WHEN $draw = 'Main' AND $relationship = 'Last Direct Acceptance' THEN 'LDA'
        WHEN $relationship = 'Default' THEN 'Q_DEFAULTED'
        WHEN $relationship = 'Retirement' THEN 'Q_RETIRED'
        WHEN $relationship = 'Walkover' THEN 'Q_WALKOVER'
        WHEN $relationship = 'Withdrawal' THEN 'Q_WITHDREW'
        WHEN $relationship = 'Last Direct Acceptance' THEN 'LDA'
      END AS relationType
      MATCH (f:Entry {id: $id})-[t:$(relationType)]->(e:Event {id: $event})
      SET t += $properties
    `

    const { summary } = await useDriver().executeQuery(query, params)

    if (summary.gqlStatusObjects.some(s => s.gqlStatus === "02000")) {
      throw createError({
        statusCode: 400,
        statusMessage: `This entry info relationship could not be found.`
      })
    } else if (Object.values(summary.counters.updates()).every(v => v === 0)) {
      throw createError({ statusCode: 400, statusMessage: "Entry info could not be updated" })
    } else {
      return { success: true }
    }
  } catch (error) {
    const zodErr = error instanceof ZodError ? error : error instanceof Error && error.cause instanceof ZodError ? error.cause : null

    if (zodErr) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body",
        data: {
          validationErrors: zodErr.issues
        }
      })
    }

    throw error
  }
})
