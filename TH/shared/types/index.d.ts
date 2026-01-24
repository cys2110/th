declare global {
  interface FormFieldInterface<S> {
    label: string
    placeholder?: string
    description?: string
    key: keyof S
    errorPattern?: RegExp
    type: string
    subType?: string
    schema?: z.ZodType
    items?: any[]
    children?: FormFieldInterface<S[keyof S][keyof S[keyof S]]>[]
    required?: boolean
    multiple?: boolean
    disabled?: boolean
    icon?: string
    class?: string
    max?: number
    currency?: CurrencyEnumType
  }

  type PlayersResultsType = BasePlayerType & GroupedPlayerResultsType

  type TournamentResultsType = TournamentType & GroupedTournamentResultsType
}

export {}
