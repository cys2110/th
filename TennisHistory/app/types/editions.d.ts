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

  interface EntryInfoInterface {
    key: string
    label: string
    entries: Array<{
      id: string
      team: Array<BasePlayerType>
      draw: DrawType
      tour: TourType
      rank?: number | null
      reason?: string | null
      teammate?: string | null
      pr?: boolean
    }>
  }

  interface IndividualEntryInterface {
    id?: string | null
    entry_id?: string | null
    points?: number | null
    seed?: Array<number | string | null>
    rank?: number | null
    pm?: number | null
    statuses: Array<string | StatusType | null>
    draws: Array<DrawType | null>
  }

  interface IndividualPlayerEntryInterface {
    id: string
    first_name: string
    last_name: string
    country: CountryType
    tour: TourType
    currency: CurrencyType
    singles: IndividualEntryInterface
    doubles: IndividualEntryInterface
  }

  interface TeamEntryInterface {
    id: string
    match_type: MatchEnumType
    tour: TourType
    team: Array<BasePlayerType & { rank: number | null }>
    seed: Array<number | string | null>
    statuses: Array<string | StatusType | null>
    draws: Array<DrawType | null>
  }

  interface ScoreInterface {
    entry_id: string
    set_no: number
    set: number
    tb: number | null
  }

  interface ResultsMatchInterface {
    id: string
    match_no: number
    court: string | null
    date: string | null
    tour: TourType | null
    match_type: MatchEnumType
    draw: DrawType
    format: 3 | 5
    incomplete: IncompleteType | null
    duration: string | null
    rounds: {
      id: string
      draw: DrawType
      tour: TourType | null
      round: RoundType
      number: number
      match_type: MatchEnumType
    }
    people: {
      id: string
      first_name: string
      last_name: string
    } | null
    winner: {
      id: string
      entry_status: Array<{
        status: StatusType
        draw: DrawType
      }>
      player_entry_mapping: Array<{
        players: Pick<PlayerInterface, "first_name" | "last_name" | "id">
        countries: CountryType
        rank: number | null
      }>
      seeds: Array<{
        seed: number
        draw: DrawType
      }>
    }
    loser: {
      id: string
      entry_status: Array<{
        status: StatusType
        draw: DrawType
      }>
      player_entry_mapping: Array<{
        players: Pick<PlayerInterface, "first_name" | "last_name" | "id">
        countries: CountryType
        rank: number | null
      }>
      seeds: Array<{
        seed: number
        draw: DrawType
      }>
    }
    match_stats: Array<{
      count: number
    }>
    match_scores: Array<ScoreInterface>
  }

  interface EditionResultTeamPlayerInterface {
    id: string
    first_name: string
    last_name: string
    country: CountryType
    rank: number | null
  }

  interface EditionResultSideInterface {
    id: string
    status?: StatusType
    seed?: number
    team: Array<EditionResultTeamPlayerInterface>
    rank?: number | null
  }

  interface EditionResultMatchInterface {
    id: string
    court: string | null
    date: string | null
    tour: TourType | null
    match_type: MatchEnumType
    format: 3 | 5
    incomplete: IncompleteType | null
    duration: string | null
    umpire: {
      first_name: string
      last_name: string
    } | null
    stats: boolean
    winner: EditionResultSideInterface
    loser: EditionResultSideInterface
    scores: Array<ScoreInterface>
  }

  interface EditionResultStepperItemInterface {
    title: RoundType
    matches: Array<EditionResultMatchInterface>
  }
}

export {}
