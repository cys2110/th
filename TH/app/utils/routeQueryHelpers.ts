/** Helper functions to transform route query parameters */

/**
 * @function toArray - Converts a route query parameter to an array
 * @param {string | string[] | null} param
 * @returns {string[]}
 */
export const toArray = (param: string | string[] | null): string[] | null => (param ? (Array.isArray(param) ? param : [param]) : [])

/**
 * @function parseSort - Parses a sort query parameter into an array of SortFieldType
 * @param {string | string[] | null} value
 * @returns {SortFieldType[]}
 */
export const parseSort = (value: string | string[] | null): SortFieldType[] => {
  if (!value) return []

  const str = Array.isArray(value) ? value.join(",") : value

  return str
    .split(",")
    .map(pair => {
      const [field, dir] = pair.split(":")
      if (!field || (dir !== "ASC" && dir !== "DESC")) return null

      return { field, direction: dir }
    })
    .filter(Boolean) as SortFieldType[]
}

/**
 * @function serialiseSort - Serialises an array of SortFieldType into a string for route query
 * @param {SortFieldType[]} value
 * @returns {string | null}
 */
export const serialiseSort = (value: SortFieldType[]): string | null => {
  if (!value?.length) return null

  return value.map(item => `${item.field}:${item.direction}`).join(",")
}

/**
 * @function parseOption - Parses an option query parameter into an array of OptionType
 * @param {string | string[] | null} value
 * @returns {OptionType[]}
 */
export const parseOption = (value: string | string[] | null): OptionType[] => {
  if (!value) return []

  const str = Array.isArray(value) ? value.join(",") : value

  if (!str) return []

  return str
    .split(",")
    .map(pair => {
      const [label, value] = pair.split(":")

      return { label, value }
    })
    .filter(Boolean) as OptionType[]
}

/**
 * @function serialiseOption - Serialises an array of OptionType into a string for route query
 * @param {OptionType[]} value
 * @returns {string | null}
 */
export const serialiseOption = (value: OptionType[]): string | null => {
  if (!value?.length) return null

  return value.map(item => `${item.label}:${item.value}`).join(",")
}
