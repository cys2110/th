import type { GqlStatusObject } from "neo4j-driver"
import { ZodError } from "zod"

export const formatGqlStatusObjects = (statusObjects: GqlStatusObject[]) => statusObjects.map(so => `${so.gqlStatus}: ${so.statusDescription}`)

export const formatZodError = (error: ZodError) =>
  error.issues.map(i => ({
    [i.path.join(".")]: {
      message: i.message,
      received: i.input
    }
  }))
