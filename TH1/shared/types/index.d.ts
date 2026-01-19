declare global {
  interface FormFieldInterface<S> {
    placeholder?: string
    help?: string
    disabled?: boolean
    multiple?: boolean
    errorPattern?: RegExp
    schema?: z.ZodType
    class?: string
    subType?: string
    children?: FormFieldInterface<S[keyof S][keyof S[keyof S]]>[]
    currency?: CurrencyEnumType
    max?: number
  }

  type WLIndexType = {
    category: string
    stat: string
    wins: number
    losses: number
    value: number
    titles: number
  }

  type PlayerStatsType = {
    stat: string
    percent?: boolean
    value: number
  }

  type RecordType = {
    year: number
  } & {
    [tournament: string]: {
      singles?: RoundEnumType
      doubles?: RoundEnumType
    }
  }

  type TournamentsResultsType = TournamentType & GroupedTournamentResultsType

  type BrokenOutEditionType = Omit<BaseEditionType, "winners"> & {
    winner:
      | CountryType
      | {
          type: MatchTypeEnumType
          tour: keyof typeof appConfig.ui.colors
          team: PersonType[]
        }
  }

  type DrawPlayer = {
    id?: string
    name: string
    country?: CountryType
  }

  type DrawContestant = {
    status?: string
    seed?: number
    players: DrawPlayer[]
  }

  type DrawScore = {
    mainScore: number
    subScore?: number
    isWinner?: boolean
  }

  type DrawSide = {
    title?: string
    contestantId?: string
    scores?: DrawScore[]
    isWinner?: boolean
  }

  type DrawMatch = {
    roundIndex: number
    order: number
    sides?: DrawSide[]
    matchStatus?: string
    isBronzeMatch?: boolean
    date?: string
    umpire?: string
    court?: string
    duration?: string
  }

  type DrawRound = {
    name?: string
  }

  type Draw = {
    rounds: DrawRound[]
    skippedLastRoundsCount?: number
    matches?: DrawMatch[]
    contestants?: {
      [contestantId: string]: DrawContestant
    }
  }
}

export {}
