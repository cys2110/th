// export const toArray = (param: string | string[] | null): string[] | null => {
//   if (!param) return []

//   return Array.isArray(param) ? param : [param]
// }

// export const parseOption = (val: string | string[] | null): OptionType[] => {
//   if (!val) return []

//   const strArray = Array.isArray(val) ? val : [val]

//   return strArray
//     .map(pair => {
//       const [label, value] = pair.split(":")
//       return { label, value }
//     })
//     .filter(Boolean) as OptionType[]
// }

// export const serialiseOption = (options: OptionType[]): string[] | null => {
//   if (!options?.length) return null

//   return options.map(item => `${item.label}:${item.value}`)
// }

// export const parseNumberOption = (val: string | string[] | null): OptionType[] => {
//   if (!val) return []

//   const strArray = Array.isArray(val) ? val : [val]

//   return strArray
//     .map(pair => {
//       const [label, value] = pair.split(":")
//       return { label, value: Number(value) }
//     })
//     .filter(Boolean) as OptionType[]
// }

// export const parseSort = (val: string | string[] | null): SortFieldType[] => {
//   if (!val) return []

//   const strArray = Array.isArray(val) ? val : [val]

//   return strArray
//     .map(pair => {
//       const [field, dir] = pair.split(":")
//       return { field, direction: dir }
//     })
//     .filter(Boolean) as SortFieldType[]
// }

// export const serialiseSort = (sortFields: SortFieldType[]): string[] | null => {
//   if (!sortFields?.length) return null

//   return sortFields.map(item => `${item.field}:${item.direction}`)
// }
