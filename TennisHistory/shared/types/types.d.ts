import { z } from "zod"
import type { ZodIssue } from "zod/v3"

declare global {
  interface ValidationError {
    validationErrors: ZodIssue[]
  }

  interface FormFieldInterface<S> {
    label: string
    placeholder?: string
    key?: keyof S
    required?: boolean
    disabled?: boolean
    multiple?: boolean
    errorPattern?: RegExp
    schema?: z.ZodType
    class?: string
    type: string
    subType?: string
    items?: any[]
    children?: FormFieldInterface<S[keyof S][keyof S[keyof S]]>[]
    currency?: CurrencyEnumType
    max?: number
    icon?: string

    // id?: string
    // tour?: TourEnumType
    // matchType?: MatchType
  }

  // interface DrawInterface {
  //   rounds: Round[]
  //   matches?: Match[]
  //   contestants?: {
  //     [contestantId: string]: Contestant
  //   }
  // }

  // type Round = {
  //   name?: string
  // }

  // type Match = {
  //   roundIndex: number // 0-based
  //   order: number // 0-based
  //   sides?: Side[]
  //   matchStatus?: string
  //   isLive?: boolean
  //   isBronzeMatch?: boolean
  //   date?: string
  //   umpire?: string
  //   court?: string
  //   duration?: string
  // }

  // type Contestant = {
  //   entryStatus?: string
  //   players: Player[]
  // }

  // type Side = {
  //   title?: string
  //   contestantId?: string
  //   scores?: Score[]
  //   currentScore?: number | string
  //   isServing?: boolean
  //   isWinner?: boolean
  // }

  // type Score = {
  //   mainScore: number | string
  //   subscore?: number | string
  //   isWinner?: boolean
  // }

  // type Player = {
  //   title: string
  //   nationality?: string
  // }

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

  type BrokenOutEditionType = Omit<BaseEditionType, "winners"> & {
    winner:
      | CountryType
      | {
          type: MatchTypeEnumType
          tour: keyof typeof appConfig.ui.colors
          team: PersonType[]
        }
  }
}

export {}
