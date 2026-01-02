export const toArray = (param: string | string[] | null): string[] | null => (param ? (Array.isArray(param) ? param : [param]) : [])

export const toNumberArray = (param: string | string[] | null) => {
  if (param) {
    if (Array.isArray(param)) {
      return param.map(Number)
    } else {
      return [Number(param)]
    }
  }

  return []
}

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

export const serialiseSort = (value: SortFieldType[]): string | null => {
  if (!value?.length) return null

  return value.map(item => `${item.field}:${item.direction}`).join(",")
}

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

export const serialiseOption = (value: OptionType[]): string | null => {
  if (!value?.length) return null

  return value.map(item => `${item.label}:${item.value}`).join(",")
}
