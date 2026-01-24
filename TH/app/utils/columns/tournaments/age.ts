import {
  PlayerLink,
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  TableRowToggle,
  UBadge,
  ULink
} from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper, type Column, type Row } from "@tanstack/vue-table"
import appConfig from "~/app.config"

export const tournamentAgeColumns = (): TableColumn<TournamentAgeType>[] => {
  const tournamentStore = useTournamentStore()

  return [
    {
      accessorKey: "tour",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientFilterHeader, {
            column: column as Column<unknown>,
            label: "Tour",
            icon: ICONS.tour
          })
        ]),
      cell: ({ cell, row, table }) => {
        const value = cell.getValue<keyof typeof appConfig.ui.colors>()
        const currentGrouping = table.getState().grouping

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "tour") {
            return h(
              TableRowToggle,
              {
                row: row as Row<unknown>,
                isExpanded: row.getIsExpanded()
              },
              () => h(UBadge, { color: value, label: value })
            )
          }
        } else if (!currentGrouping.includes("tour")) {
          return h(UBadge, { color: value, label: value })
        }
      }
    },
    {
      accessorKey: "type",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientFilterHeader, {
            column: column as Column<unknown>,
            label: "S/D",
            icon: ICONS.people
          })
        ]),
      cell: ({ cell, row, table }) => {
        const value = cell.getValue<keyof typeof appConfig.ui.colors>()
        const currentGrouping = table.getState().grouping

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "type") {
            return h(
              TableRowToggle,
              {
                row: row as Row<unknown>,
                isExpanded: row.getIsExpanded()
              },
              () => h(UBadge, { color: value, label: value })
            )
          }
        } else if (!currentGrouping.includes("type")) {
          return h(UBadge, { color: value, label: value })
        }
      }
    },
    {
      accessorKey: "year",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientFilterHeader, {
            column: column as Column<unknown>,
            label: "Year",
            icon: ICONS.years
          }),
          h(TableClientSortHeader, {
            column: column as Column<unknown>
          })
        ]),
      cell: ({ cell, row, table }) => {
        const currentGrouping = table.getState().grouping

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "year") {
            return h(
              TableRowToggle,
              {
                row: row as Row<unknown>,
                isExpanded: row.getIsExpanded()
              },
              () =>
                h(
                  ULink,
                  {
                    class: "hover-link default-link",
                    to: {
                      name: "edition",
                      params: {
                        id: tournamentStore.id,
                        name: kebabCase(tournamentStore.name),
                        year: row.original.year,
                        edId: row.original.edId
                      }
                    }
                  },
                  () => row.original.year
                )
            )
          }
        } else if (!currentGrouping.includes("year")) {
          return h(
            ULink,
            {
              class: "hover-link default-link",
              to: {
                name: "edition",
                params: {
                  id: tournamentStore.id,
                  name: kebabCase(tournamentStore.name),
                  year: row.original.year,
                  edId: row.original.edId
                }
              }
            },
            () => row.original.year
          )
        }
      }
    },
    {
      id: "player",
      accessorFn: row => `${row.last_name}, ${row.first_name}`,
      header: ({ column }) =>
        h("div", { class: "flex justify-center items-center gap-0.5" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientNameFilterHeader, {
            column: column as Column<unknown>,
            label: "Player",
            icon: ICONS.player
          }),
          h(TableClientSortHeader, {
            column: column as Column<unknown>
          })
        ]),
      cell: ({ row, table }) => {
        const currentGrouping = table.getState().grouping

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "player") {
            return h(
              TableRowToggle,
              {
                row: row as Row<unknown>,
                isExpanded: row.getIsExpanded()
              },
              () =>
                h(PlayerLink, {
                  player: {
                    id: row.original.id,
                    first_name: row.original.first_name,
                    last_name: row.original.last_name,
                    country: row.original.country
                  }
                })
            )
          }
        } else if (!currentGrouping.includes("player")) {
          return h(PlayerLink, {
            player: {
              id: row.original.id,
              first_name: row.original.first_name,
              last_name: row.original.last_name,
              country: row.original.country
            }
          })
        }
      }
    },
    {
      id: "age",
      accessorFn: row => {
        if (row.age) {
          const { months, days } = row.age
          return months * 30.436875 + days
        }
      },
      aggregationFn: "mean",
      header: ({ column }) =>
        h(TableClientSortHeader, {
          column: column as Column<unknown>,
          label: "Age"
        }),
      cell: ({ cell, row }) => {
        if (row.getIsGrouped()) {
          if (row.groupingColumnId !== "player") {
            const value = cell.getValue<number>()
            const avgMonths = Math.floor(value / 30.436875)
            const avgDays = Math.round(value % 30.436875)

            const years = Math.floor(avgMonths / 12)
            const months = avgMonths % 12
            const days = avgDays

            return `Avg: ${years}y ${months}m ${days}d`
          }
        } else {
          if (row.original.age) {
            const years = Math.floor(row.original.age.months / 12)
            const months = row.original.age.months % 12
            const days = row.original.age.days

            return `${years}y ${months}m ${days}d`
          }
        }
      }
    }
  ]
}
