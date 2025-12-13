import { DevOnly, EditionsAwardsUpdate, UBadge } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
import appConfig from "~/app.config"

type ConsolidatedRound = {
  round: string
  currency: CurrencyEnumType | null
  singles: Record<keyof typeof tourEnum, { pm: number | null; points: number | null }>
  doubles: Record<keyof typeof tourEnum, { pm: number | null; points: number | null }>
}

const columnHelper = createColumnHelper<ConsolidatedRound>()

const columns = (
  tours: (keyof typeof tourEnum)[],
  refresh: () => void,
  getRound: (round: RoundEnumType, type: MatchTypeEnumType, tour: keyof typeof tourEnum) => AwardType | undefined
): TableColumn<ConsolidatedRound>[] => {
  return [
    columnHelper.group({
      id: "round-parent",
      columns: [
        {
          header: "Round",
          columns: [
            {
              accessorKey: "round",
              header: undefined
            }
          ]
        }
      ]
    }),
    columnHelper.group({
      id: "singles",
      header: () =>
        h(UBadge, {
          color: "Singles",
          label: "Singles",
          class: "w-full justify-center"
        }),
      columns: [
        columnHelper.group({
          id: "pm",
          header: "Prize Money",
          columns: tours.map(tour => ({
            id: `${tour}-singles-pm`,
            accessorKey: `singles.${tour}.pm`,
            header:
              tours.length > 1
                ? () =>
                    h(UBadge, {
                      color: tour as keyof typeof appConfig.ui.colors,
                      label: tour,
                      class: "w-full justify-center"
                    })
                : undefined,
            cell: ({ cell, row }) => {
              if (isDefined(cell.getValue())) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EditionsAwardsUpdate,
                        {
                          award: getRound(row.original.round as RoundEnumType, "Singles", tour),
                          refresh
                        },
                        () =>
                          (cell.getValue() as number).toLocaleString("en-GB", {
                            style: "currency",
                            currency: row.original.currency!
                          })
                      ),
                    fallback: () =>
                      (cell.getValue() as number).toLocaleString("en-GB", {
                        style: "currency",
                        currency: row.original.currency!
                      })
                  }
                )
              } else {
                return cell.renderValue()
              }
            }
          }))
        }),
        columnHelper.group({
          id: "points",
          header: "Points",
          columns: tours.map(tour => ({
            id: `${tour}-singles-points`,
            accessorKey: `singles.${tour}.points`,
            header:
              tours.length > 1
                ? () =>
                    h(UBadge, {
                      color: tour as keyof typeof appConfig.ui.colors,
                      label: tour,
                      class: "w-full justify-center"
                    })
                : undefined,
            cell: ({ cell, row }) => {
              if (isDefined(cell.getValue())) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EditionsAwardsUpdate,
                        {
                          award: getRound(row.original.round as RoundEnumType, "Singles", tour),
                          refresh
                        },
                        () => (cell.getValue() as number).toLocaleString()
                      ),
                    fallback: () => (cell.getValue() as number).toLocaleString()
                  }
                )
              } else {
                return cell.renderValue()
              }
            }
          }))
        })
      ]
    }),
    columnHelper.group({
      id: "doubles",
      header: () =>
        h(UBadge, {
          color: "Doubles",
          label: "Doubles",
          class: "w-full justify-center"
        }),
      columns: [
        columnHelper.group({
          id: "pm",
          header: "Prize Money",
          columns: tours.map(tour => ({
            id: `${tour}-doubles-pm`,
            accessorKey: `doubles.${tour}.pm`,
            header:
              tours.length > 1
                ? () =>
                    h(UBadge, {
                      color: tour as keyof typeof appConfig.ui.colors,
                      label: tour,
                      class: "w-full justify-center"
                    })
                : undefined,
            cell: ({ cell, row }) => {
              if (isDefined(cell.getValue())) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EditionsAwardsUpdate,
                        {
                          award: getRound(row.original.round as RoundEnumType, "Doubles", tour),
                          refresh
                        },
                        () =>
                          (cell.getValue() as number).toLocaleString("en-GB", {
                            style: "currency",
                            currency: row.original.currency!
                          })
                      ),
                    fallback: () =>
                      (cell.getValue() as number).toLocaleString("en-GB", {
                        style: "currency",
                        currency: row.original.currency!
                      })
                  }
                )
              } else {
                return cell.renderValue()
              }
            }
          }))
        }),
        columnHelper.group({
          id: "points",
          header: "Points",
          columns: tours.map(tour => ({
            id: `${tour}-doubles-points`,
            accessorKey: `doubles.${tour}.points`,
            header:
              tours.length > 1
                ? () =>
                    h(UBadge, {
                      color: tour as keyof typeof appConfig.ui.colors,
                      label: tour,
                      class: "w-full justify-center"
                    })
                : undefined,
            cell: ({ cell, row }) => {
              if (isDefined(cell.getValue())) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EditionsAwardsUpdate,
                        {
                          award: getRound(row.original.round as RoundEnumType, "Doubles", tour),
                          refresh
                        },
                        () => (cell.getValue() as number).toLocaleString()
                      ),
                    fallback: () => (cell.getValue() as number).toLocaleString()
                  }
                )
              } else {
                return cell.renderValue()
              }
            }
          }))
        })
      ]
    })
  ]
}

export default columns
