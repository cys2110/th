declare global {
  interface EditionWinnersInterface {
    id: number
    year: number
    laverWinner?: {
      team_name: string | null
      points: number
    }
    country?: CountryType
    tour?: TourType
    match_type?: MatchEnumType
    team?: Array<Required<BasePlayerType>>
  }

  interface EditionInterface {
    id: number
    category: CategoryType | null
    currency: CurrencyType | null
    draw_link: string | null
    draw_type: DrawsType | null
    end_date: string | null
    sponsor_name: string | null
    start_date: string | null
    tfc: number | null
    tours: Array<TourType>
    wiki_link: string | null
    year: number
    updated_at: string
    events: Array<EventInterface>
  }

  interface EventInterface {
    id: string
    category: CategoryType | null
    currency: CurrencyType | null
    d_draw: DrawsType | null
    d_link: string | null
    end_date: string | null
    level: LevelType | null
    pm: number | null
    qd_draw: DrawsType | null
    qd_link: string | null
    qs_draw: DrawsType | null
    qs_link: string | null
    s_draw: DrawsType | null
    s_link: string | null
    site_link: string | null
    sponsor_name: string | null
    start_date: string | null
    supervisors: Array<SupervisorInterface>
    surfaces: Array<SurfaceInterface>
    tfc: number | null
    tour: TourType | null
    wiki_link: string | null
    updated_at: string
    venues: Array<VenueInterface>
  }

  interface CountrySeedInterface {
    seed: number
    countries: CountryType
  }

  interface AwardInterface {
    id: string
    number: number
    round: RoundType | null
    points: number | null
    pm: number | null
    tour: TourType | null
    match_type: MatchEnumType | null
    draw: DrawType | null
    currency: CurrencyType | null
  }

  interface SeedInterface {
    id: string
    seed: number
    rank: number | null
    tour: TourType
    draw: DrawType
    match_type: MatchEnumType
    team: Array<BasePlayerType>
    withdrew: boolean
  }
}

export {}
