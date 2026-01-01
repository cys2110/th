

import { z } from "zod"

declare global {
  
  type WriteResponseType = {
    success: boolean
    error?: string
  }

  
  interface FormFieldInterface<S> {
    label: string
    placeholder?: string
    key?: keyof S
    required?: boolean
    errorPattern?: RegExp
    schema?: z.ZodType
    class?: string
    type?: string
    subType?: string
    items?: any[]
    // children form fields take nested keys of nested keys of S
    children?: FormFieldInterface<S[keyof S][keyof S[keyof S]]>[]
  }

  
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
}

export {}
