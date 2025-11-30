import { z } from "zod"

declare global {
  interface FormFieldInterface<S> {
    label: string
    key?: keyof S
    type: string
    subType?: string
    errorPattern?: RegExp
    placeholder?: string
    icon?: string
    items?: any[]
    max?: number
    currency?: CurrencyEnumType
    required?: boolean
    disabled?: boolean
    multiple?: boolean
    class?: string
    children?: FormFieldInterface<S>[]
    id?: string
    tour?: TourEnumType
    matchType?: MatchType
    schema?: z.ZodType
  }

  interface DrawInterface {
    rounds: Round[]
    matches?: Match[]
    contestants?: {
      [contestantId: string]: Contestant
    }
  }

  type Round = {
    name?: string
  }

  type Match = {
    roundIndex: number // 0-based
    order: number // 0-based
    sides?: Side[]
    matchStatus?: string
    isLive?: boolean
    isBronzeMatch?: boolean
    date?: string
    umpire?: string
    court?: string
    duration?: string
  }

  type Contestant = {
    entryStatus?: string
    players: Player[]
  }

  type Side = {
    title?: string
    contestantId?: string
    scores?: Score[]
    currentScore?: number | string
    isServing?: boolean
    isWinner?: boolean
  }

  type Score = {
    mainScore: number | string
    subscore?: number | string
    isWinner?: boolean
  }

  type Player = {
    title: string
    nationality?: string
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
}

export {}
