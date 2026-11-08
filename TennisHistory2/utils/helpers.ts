import { type Row } from "@tanstack/vue-table"

export const formatAtpLink = (link: string) => {
  if (!link.startsWith("https://www.atptour.com")) {
    return `https://www.atptour.com${link}`
  }
  return link
}

export const arrayFilter = (row: Row<any>, columnId: string, filterValue: string[]) => {
  const values = (row.getValue(columnId) as string[]) || []

  if (!filterValue.length) return true
  if (values.some(v => filterValue.includes(v))) return true

  return false
}

export const calculatePercentage = (value1: number, value2: number, decimalPlaces?: number) => {
  const decimal = decimalPlaces || 0
  let percentage = 0

  if (value2) percentage = (value1 / value2) * 100

  return Number(percentage.toFixed(decimal))
}

// Generics
export const isLaverWinner = (item: EditionWinnerType): item is LaverCupWinnerInterface => "team_name" in item

export const isCountryWinner = (item: EditionWinnerType): item is CountryWinnerInterface => "country" in item

export const isEliminationWinner = (item: EditionWinnerType): item is EliminationWinnerInterface => "tour" in item
