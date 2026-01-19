declare global {
  interface FormFieldInterface<S> {
    label: string
    placeholder?: string
    key: keyof S
    type: string
    subType?: string
    items?: any[]
    required?: boolean
    disabled?: boolean
    icon?: string
  }

  type PlayersResultsType = BasePlayerType & GroupedPlayerResultsType
}

export {}
