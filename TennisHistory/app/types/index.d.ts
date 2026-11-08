declare global {
  interface FormFieldInterface<S> {
    label: string
    key: keyof S
    type: string

    // optional fields
    placeholder?: string
    description?: string
    icon?: string
    max?: number
    currency?: string
    class?: string

    required?: boolean
    disabled?: boolean
    rotateIcon?: boolean

    // object fields
    items?: any
    multiple?: boolean
    loading?: boolean
    valueKey?: string
    labelKey?: string
  }

  interface DrawOption {
    label: string
    draw_type: DrawTypeEnum
    link: string | null
    tour: TourEnum
    match_type: MatchTypeEnum
    draw: DrawEnum
  }

  type ChartCategory = {
    label: string
    key: string
    color: string
  }

  type EventSelection = {
    tournament?: TournamentType
    edition?: Pick<Tables<{ schema: "tennis" }, "editions">, "id" | "year" | "edition_no" | "tours" | "currency"> & { label: string }
    event?: Pick<Tables<{ schema: "tennis" }, "events">, "id" | "tour" | "currency">
  }
}

export {}
