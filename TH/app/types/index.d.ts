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
    currency?: CurrencyType
  }

  interface PersonInterface {
    id: string
    full_name: string
  }

  interface SurfaceInterface {
    id: string
    environment: "Indoor" | "Outdoor"
    surface: "Clay" | "Grass" | "Hard" | "Carpet"
  }

  interface CountryInterface {
    id: string
    name: string
    continent: ContinentType
    alpha_2: string | null
    icon: string
  }

  interface VenueInterface {
    id: string
    name: string | null
    city: string
    country: CountryInterface
  }

  interface PlayerInterface {
    id: string
    first_name?: string
    last_name?: string
    full_name: string
    country: CountryInterface
    tour: TourType
    dob: string | null
  }

  type BasePlayerType = Pick<PlayerInterface, "id" | "full_name" | "country" | "first_name" | "last_name">

  interface TournamentInterface {
    id: number
    name: string
    tours: Array<TourType>
    established: number | null
    abolished: number | null
    website: string | null
  }

  type BaseTournamentType = Pick<TournamentInterface, "id" | "name" | "tours">

  interface EditionInterface {
    id: number
    year: number
    sponsor_name: string | null
    tours: Array<TourType>
    category: CategoryType | null
    start_date: string | null
    end_date: string | null
    currency: CurrencyType | null
    tfc: number | null
    wiki_link: string | null
    draw_type: DrawsType | null
    draw_link: string | null
    events: Array<EventInterface>
    updated_at: string
  }

  interface EventInterface {
    id: string
    level: LevelType | null
    tour: TourType | null
    sponsor_name: string | null
    category: string | null
    start_date: string | null
    end_date: string | null
    currency: CurrencyType | null
    pm: number | null
    tfc: number | null
    site_link: string | null
    wiki_link: string | null
    surfaces: Array<SurfaceInterface>
    venues: Array<VenueInterface>
    supervisors: Array<PersonInterface>
    s_draw: DrawsType | null
    s_link: string | null
    d_draw: DrawsType | null
    d_link: string | null
    qs_draw: DrawsType | null
    qs_link: string | null
    qd_draw: DrawsType | null
    qd_link: string | null
    undefeated_bonus: number | null
    updated_at: string
  }

  interface ArchiveInterface {
    id: number
    sponsor_name: string | null
    year: number
    tours: Array<TourType>
    category: CategoryType | null
    start_date: string | null
    end_date: string | null
    tournament: BaseTournamentType
    events: Array<EventInterface>
  }

  type EditionWinnerType = LaverCupWinnerInterface | CountryWinnerInterface | EliminationWinnerInterface

  interface LaverCupWinnerInterface {
    year: number
    edition_id: number
    end_date: string
  }

  interface CountryWinnerInterface {
    year: number
    edition_id: number
    country: CountryInterface
    end_date: string
  }

  interface EliminationWinnerInterface {
    year: number
    edition_id: number
    end_date: string
    tour: TourType
    match_type: MatchEnumType
    team: Array<Required<BasePlayerType>>
  }
}

export {}
