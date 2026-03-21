declare global {
  interface FormFieldInterface<S> {
    label: string
    type: string
    subType?: string
    description?: string
    placeholder?: string
    icon?: string
    class?: string

    required?: boolean
    disabled?: boolean
    multiple?: boolean
    loading?: boolean
    rotateIcon?: boolean

    max?: number

    key?: keyof S
    items?: any
    valueKey?: string
    labelKey?: string
    errorPattern?: RegExp
    schema?: z.ZodType
    currency?: CurrencyType
  }

  interface SortingInterface {
    field: string
    direction: boolean // true = ASC, false = DESC
  }

  interface VenueInterface {
    id: string
    name: string | null
    city: string
    country: CountryType
  }

  interface PersonInterface {
    id: string
    first_name: string
    last_name: string
  }

  interface SurfaceInterface {
    id: string
    environment: "Indoor" | "Outdoor"
    surface: "Clay" | "Grass" | "Hard" | "Carpet"
  }

  interface TournamentFiltersInterface {
    tours: Array<TourType>
    established?: number
    abolished?: number
    tournaments: Array<number>
  }

  interface PlayerFiltersInterface {
    tours: Array<TourType>
    players: Array<string>
    countries: Array<string>
    turned_pro?: number
    retired?: number
  }

  interface CountryFiltersInterface {
    countries: Array<string>
    continents: Array<ContinentType>
  }
}

export {}
