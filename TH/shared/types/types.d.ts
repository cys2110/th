declare global {
  type WriteResponseType = {
    success: boolean
    error?: string
  }

  interface FormFieldInterface<S> {
    label: string
    key?: keyof S
    type: string
    required?: boolean
    items?: any[]
  }

  type PlayersResultsType = BasePlayerType & {
    subRows: PlayersResultsType[]
    __group: boolean
    has_children: boolean
    count: number
    group_key: { key: string | number }
    name: string
    alpha2?: string
    min_year: number
    max_year: number
  }
}

export {}
