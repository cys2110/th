declare global {
  interface FormFieldInterface<S> {
    label: string
    placeholder?: string
    key: keyof S
    // errorPattern?: RegExp
    type: string
    subType?: string
    // schema?: z.ZodType
    items?: any[]
    // children?: FormFieldInterface<S[keyof S][keyof S[keyof S]]>[]
    required?: boolean
    disabled?: boolean
    icon?: string
    class?: string
  }

  type PlayersResultsType = BasePlayerType & GroupedPlayerResultsType
}

export {}
