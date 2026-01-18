declare global {
  interface FormFieldInterface<S> {
    label: string
    placeholder?: string
    key?: keyof S
    required?: boolean
    disabled?: boolean
    multiple?: boolean
    errorPattern?: RegExp
    schema?: z.ZodType
    class?: string
    type?: string
    subType?: string
    items?: any[]
    children?: FormFieldInterface<S[keyof S][keyof S[keyof S]]>[]
    currency?: CurrencyEnumType
    max?: number
    icon?: string
  }

  type TournamentsResultsType = TournamentType & TournamentsResultsType
}

export {}
