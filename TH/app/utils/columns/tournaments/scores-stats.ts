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

const columnHelper = createColumnHelper<TournamentScoresStatsType>()

export const tournamentScoresStatsColumns = (): TableColumn<TournamentScoresStatsType>[] => {
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
        } else {
          if (!currentGrouping.includes("tour")) {
            return h(UBadge, { color: value, label: value })
          }
        }
      }
    },
    {
      accessorKey: "year",
      header: ({ column }) =>
        h("div", { class: "flex items-center justify-center gap-0.5" }, [
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
      cell: ({ row, table }) => {
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
                        edId: row.original.id
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
                  edId: row.original.id
                }
              }
            },
            () => row.original.year
          )
        }
      }
    },
    {
      id: "team",
      accessorFn: row => row.team.map(player => `${player.last_name}, ${player.first_name}`).join(" / "),
      header: ({ column }) =>
        h("div", { class: "flex justify-center items-center gap-0.5" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientNameFilterHeader, {
            column: column as Column<unknown>,
            label: "Team",
            icon: ICONS.player
          }),
          h(TableClientSortHeader, {
            column: column as Column<unknown>
          })
        ]),
      cell: ({ row, table }) => {
        const currentGrouping = table.getState().grouping

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "team") {
            return h(
              TableRowToggle,
              {
                row: row as Row<unknown>,
                isExpanded: row.getIsExpanded()
              },
              () =>
                h(
                  "div",
                  {
                    class: "flex flex-col"
                  },

                  row.original.team.map(player =>
                    h(PlayerLink, {
                      key: player.id,
                      player
                    })
                  )
                )
            )
          }
        } else if (!currentGrouping.includes("team")) {
          return row.original.team.map(player =>
            h(PlayerLink, {
              key: player.id,
              player
            })
          )
        }
      }
    },
    columnHelper.group({
      header: "Sets",
      columns: [
        {
          id: "sets_wl",
          header: "Win-Loss",
          cell: ({ row }) => {
            if (!row.getIsGrouped()) {
              return `${row.original.sets_won}-${row.original.sets_lost}`
            }
          }
        },
        {
          id: "sets_pc",
          accessorFn: row => percentage(row.sets_won, row.sets_won + row.sets_lost),
          aggregationFn: "mean",
          header: "Win %",
          cell: ({ cell, row }) => {
            const value = cell.getValue<number>()
            if (row.getIsGrouped()) {
              return `Avg: ${Math.round(value)}%`
            } else {
              return `${Math.round(value)}%`
            }
          }
        }
      ]
    }),
    columnHelper.group({
      header: "Games",
      columns: [
        {
          id: "games_wl",
          header: "Win-Loss",
          cell: ({ row }) => {
            if (!row.getIsGrouped()) {
              return `${row.original.games_won}-${row.original.games_lost}`
            }
          }
        },
        {
          id: "games_pc",
          accessorFn: row => percentage(row.games_won, row.games_won + row.games_lost),
          aggregationFn: "mean",
          header: "Win %",
          cell: ({ cell, row }) => {
            const value = cell.getValue<number>()
            if (row.getIsGrouped()) {
              return `Avg: ${Math.round(value)}%`
            } else {
              return `${Math.round(value)}%`
            }
          }
        }
      ]
    })
  ]
}
