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

  interface CountryInterface {
    id: string
    name: string
    continent: ContinentType
    alpha_2: string | null
    icon?: string
  }

  interface VenueInterface {
    id: string
    name: string | null
    city: string
    country: CountryInterface
  }

  interface PersonInterface {
    id: string
    first_name: string
    last_name: string
    full_name: string
  }

  interface SurfaceInterface {
    id: string
    environment: "Indoor" | "Outdoor"
    surface: "Clay" | "Grass" | "Hard" | "Carpet"
  }

  interface BasePlayerType {
    id: string
    first_name: string | null
    last_name: string | null
    country: CountryType | null
    full_name: string | null
  }

  interface PlayerInterface extends BasePlayerType {
    tour: TourType
    turned_pro: number | null
    retired: number | null
    ch_singles: number | null
    ch_singles_date: string | null
    ch_doubles: number | null
    ch_doubles_date: string | null
    current_singles: number | null
    current_doubles: number | null
    turned_pro: number | null
    retired: number | null
    dob: string | null
    dod: string | null
    height: number | null
    hof: number | null
    pm: number | null
    site_link: string | null
    wiki_link: string | null
    official_link: string | null
    countries: Array<{
      start_date: string | null
      end_date: string | null
      id: string
      country: CountryInterface
    }>
    coaches: Array<{
      id: string
      years: string | null
      status: "Current" | "Former"
      coach: PersonInterface & { player_id: string | null }
    }>
    bh: "One" | "Two" | null
    rh: "Right" | "Left" | null
    updated_at: string
    first_tournament: number | null
    last_tournament: number | null
  }

  type PlayerListType = Pick<
    PlayerInterface,
    "id" | "first_name" | "last_name" | "tour" | "turned_pro" | "retired" | "country" | "first_tournament" | "last_tournament" | "full_name"
  >

  type ArchiveEditionType = Pick<EditionInterface, "id" | "category" | "end_date" | "sponsor_name" | "start_date" | "tours" | "year"> & {
    tournament: Pick<TournamentInterface, "id" | "name">
    events: Array<Pick<EventInterface, "category" | "end_date" | "level" | "sponsor_name" | "surfaces" | "start_date" | "tour" | "venues">>
  }

  interface TournamentFiltersInterface {
    tours: Array<TourType>
    established?: number
    abolished?: number
    tournaments: Array<{
      id: number
      name: string
    }>
  }

  interface TournamentInterface {
    id: number
    name: string
    tours: Array<TourType>
    abolished: number | null
    established: number | null
    website: string | null
  }

  interface PlayerFiltersInterface {
    tour?: TourType
    players: Array<{
      id: string
      name: string
      icon: string
    }>
    countries: Array<string>
    turned_pro?: number
    retired?: number
    first_tournament?: number
    last_tournament?: number
  }

  interface CountryFiltersInterface {
    countries: Array<string>
    continents: Array<ContinentType>
  }

  interface MatchSideInterface {
    id: string
    status: StatusType | null
    seed: number | null
    team: Array<Required<BasePlayerType> & { rank: number | null }>
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
    scores: Array<ConsolidatedScore>
    team1: MatchSideInterface
    team2: MatchSideInterface
    winner_id: string
    surface: SurfaceInterface
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

  interface RoundRobinGroup {
    group: string
    matches: Array<RoundRobinMatch>
  }

  interface RoundRobinMatch {
    id: string
    format: 3 | 5
    match_no: number
    tour: TourType
    match_type: MatchEnumType
    draw: DrawType
    winner_id: string
    stats: boolean
    team_1_id: string
    team_2_id: string
    incomplete: IncompleteType | null
    scores: Array<ScoreInterface>
    team_1: {
      seed: number | null
      status: StatusType | null
      team: Array<Required<BasePlayerType> & { rank: number | null }>
    }
    team_2: {
      seed: number | null
      status: StatusType | null
      team: Array<Required<BasePlayerType> & { rank: number | null }>
    }
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

  interface LaverWinnerInterface {
    id: number
    year: number
    team_name: string | null
    points: number
  }

  interface CountryWinnerInterface {
    id: number
    year: number
    country: CountryInterface
  }

  interface EditionWinnerInterface {
    id: number
    year: number
    match_type: MatchEnumType
    tour: TourType
    team: Array<Required<BasePlayerType>>
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
    pm_tiered: Array<number> | null
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
    full_name: string
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
    team: Array<Required<BasePlayerType> & { rank: number | null }>
    seed: number | string | null
    statuses: Array<string | StatusType | null>
    draws: Array<DrawType | null>
  }

  interface ScoreInterface {
    entry_id: string
    set_no: number
    set: number
    tb: number | null
  }

  interface ConsolidatedScore {
    match_id: string
    t1_id: string
    t2_id: string
    set_no: number
    t1_set: number
    t2_set: number
    t1_tb: number | null
    t2_tb: number | null
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
    round: {
      round: RoundType
      number: number
    }
    umpire: {
      id: string
      first_name: string
      last_name: string
      full_name: string
    } | null
    winner: {
      id: string
      status: StatusType | null
      seed: number | null
      team: Array<Required<BasePlayerType & { rank: number | null }>>
    }
    loser: {
      id: string
      status: StatusType | null
      seed: number | null
      team: Array<Required<BasePlayerType & { rank: number | null }>>
    }
    stats: boolean
    scores: Array<ConsolidatedScore>
  }

  interface DrawEntry {
    status: StatusType | null
    seed: number | null
    team: Array<Required<BasePlayerType>>
  }

  interface DrawScore {
    mainScore: number
    tiebreak: number | null
    isWinner: boolean
  }

  interface DrawSide {
    entryId?: string
    scores: Array<DrawScore>
    isWinner?: boolean
  }

  interface DrawMatch {
    match_no: number
    date: string | null
    duration: string | null
    court: string | null
    umpire: string | null
    sides: Array<DrawSide>
    incomplete: IncompleteType | null
    isBronzeMatch?: boolean
  }

  interface DrawData {
    rounds: Array<{
      name: RoundType
      number: number
      matches: Array<DrawMatch>
    }>
    entries: {
      [entryId: string]: DrawEntry
    }
  }
}

export {}
