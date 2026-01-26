import type z from "zod"

declare global {
  interface ValidationErrors {
    [key: string]: {
      message: string
      received: any
    }
  }

  interface FormFieldInterface<S> {
    label: string
    key: keyof S
    type: string
    required?: boolean
    icon?: string
    description?: string
    items?: any
    class?: string
    disabled?: boolean
    multiple?: boolean
    placeholder?: string
    subType?: string
    max?: number
    errorPattern?: RegExp
    schema?: z.ZodType
    currency?: CurrencyEnumType
    children?: FormFieldInterface<S[keyof S][keyof S[keyof S]]>[]
  }

  type PlayersResultsType = BasePlayerType & GroupedPlayerResultsType

  type RecordType = {
    year: number
  } & {
    [tournament: string]: {
      singles?: RoundEnumType
      doubles?: RoundEnumType
    }
  }
}

export {}
