/**
 * @module types.d.ts
 * @description Global types
 */

import { z } from "zod"

declare global {
  /**
   * @type {WriteResponseType}
   * @property {boolean} success - Indicates if the write operation was successful
   * @property {string} [error] - Optional error message if the operation failed
   */
  type WriteResponseType = {
    success: boolean
    error?: string
  }

  /**
   * @interface FormFieldInterface<S>
   * @template S - The schema type the form field is associated with
   * @property {string} label - The label for the form field
   * @property {keyof S} [key] - The key in the schema that this form field corresponds to
   * @property {string} type - The type of the form field (e.g., text, number, select) to determine which component to use
   * @property {boolean} [required] - Indicates if the form field is required
   * @property {any[]} [items] - Optional items for select-type fields
   * @property {string} [placeholder] - Optional placeholder text for the form field
   * @property {"text" | "number"} [subType] - Optional subtype for further specification of the field type
   * @property {string} [class] - Optional tailwind class for styling the form field
   */
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

  /**
   * @type {PlayersResultsType}
   * @property {PlayersResultsType[]} subRows - Sub-rows for grouped data
   * @property {boolean} __group - Indicates if the row is a group header
   * @property {boolean} has_children - Indicates if the player has children entries
   * @property {number} count - Count of entries in the group
   * @property {{ key: string | number }} group_key - The key used for grouping
   * @property {string} name - The name of the country
   * @property {string} [alpha2] - Optional 2-letter country code
   * @property {number} min_year - The minimum year of activity
   * @property {number} max_year - The maximum year of activity
   */
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

  /**
   * @type {RecordType}
   * @property {number} year - The year of the record
   * @property {Object} tournaments - An object where each key is a tournament name and the value is an object containing singles and doubles rounds
   * @property {RoundEnumType} [tournaments.singles] - The round reached in singles
   * @property {RoundEnumType} [tournaments.doubles] - The round reached in doubles
   */
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
