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

  type ArchiveEditionType = Pick<EditionInterface, "id" | "category" | "end_date" | "sponsor_name" | "start_date" | "tours" | "year"> & {
    tournament: Pick<TournamentInterface, "id" | "name">
    events: Array<Pick<EventInterface, "category" | "end_date" | "level" | "sponsor_name" | "surfaces" | "start_date" | "tour" | "venues">>
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

  interface MatchInterface {
    court: string | null
    date: string | null
    tour: TourType | null
    match_type: MatchEnumType
    group_name: string | null
    draw: DrawType
    format: 3 | 5
    incomplete: IncompleteType | null
    duration: string | null
    umpire: PersonInterface | null
    round: RoundType
    category: CategoryType | null
    start_date: string | null
    end_date: string | null
    level: LevelType
    sponsor_name: string | null
    tournament: string | null
    scores: Array<ScoreInterface>
    team1: EditionResultSideInterface
    team2: EditionResultSideInterface
    winner_id: string
    surfaces: SurfaceInterface[]
    stats: Array<{
      match_id: string
      entry_id: string
      serve1_w: number
      serve1: number
      serve2_w: number
      serve2: number
      ret1_w: number
      ret1: number
      ret2_w: number
      ret2: number
      winners: number | null
      ues: number | null
      bps_converted: number
      bp_opps: number
      bps_saved: number
      bps_faced: number
      net_w: number | null
      net: number | null
      aces: number
      dfs: number
      serve_games: number | null
      return_games: number | null
      avg1_speed: number | null
      avg2_speed: number | null
      max_speed: number | null
    }>
  }
}

export {}
