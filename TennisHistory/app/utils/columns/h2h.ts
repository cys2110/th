import {
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  UBadge,
  UButton,
  UIcon
} from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import type { Column } from "@tanstack/table-core"
import appConfig from "~/app.config"

export const h2hColumns = (players: H2HPlayerType[]): TableColumn<H2HBaseType>[] => [
  {
    id: "rank",
    accessorFn: row => {
      const player = players.find(p => p.id === row.player)
      return player?.current_singles
    },
    meta: { class: { td: "text-center" } },
    header: ""
  },
  {
    accessorKey: "player",
    header: "",
    cell: ({ row }) => {
      const player = players.find(p => p.id === row.original.player)

      return h("div", { class: "flex items-center gap-2" }, [
        h(UIcon, { name: getFlagCode(player?.country!) }),
        `${player?.first_name} ${player?.last_name}`
      ])
    }
  },
  ...players.map(player => ({
    key: player.id,
    accessorKey: player.id,
    header: `${player.first_name} ${player.last_name}`,
    cell: ({ row }: { row: TableRow<H2HBaseType> }) => {
      if (row.original.player === player.id) {
        return "—"
      } else {
        const opponent = players.find(p => p.id === row.original.player)

        return h(UButton, {
          variant: "link",
          color: "neutral",
          label: row.original[player.id] || "0-0",
          size: "md",
          ui: { label: "hover-link default-link" },
          to: {
            name: "h2h",
            query: {
              team1: `${kebabCase(`${player.first_name}-${player.last_name}`)}:${player.id}`,
              team2: `${kebabCase(`${opponent?.first_name}-${opponent?.last_name}`)}:${opponent?.id}`
            }
          }
        })
      }
    }
  }))
]

export const h2hMatchesColumns = (teams: { team1: H2HTeamType; team2: H2HTeamType }): TableColumn<H2HMatchType>[] => [
  {
    accessorKey: "year",
    aggregationFn: "uniqueCount",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Year"
        }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ]),
    cell: ({ cell, row, table }) => {
      const grouping = table.getState().grouping

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "year") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            cell.getValue<string>()
          ])
        } else {
          const currentGroupingIndex = grouping.indexOf(row.groupingColumnId!)
          const yearGroupingIndex = grouping.indexOf("year")

          if (yearGroupingIndex === -1) {
            const value = cell.getValue<number>()

            return `${value} year${value === 1 ? "" : "s"}`
          } else if (currentGroupingIndex < yearGroupingIndex) {
            const uniqueYears = useArrayUnique(row.getLeafRows().map(r => r.getValue("year"))).value.filter(Boolean).length

            return `${uniqueYears} year${uniqueYears === 1 ? "" : "s"}`
          }
        }
      } else if (!grouping.includes("year")) {
        return cell.renderValue()
      }
    }
  },
  {
    id: "winning_team",
    accessorFn: row =>
      row.winning_team === "t1"
        ? teams.team1.players.map(p => `${p.last_name}, ${p.first_name}`).join(" / ")
        : teams.team2.players.map(p => `${p.last_name}, ${p.first_name}`).join(" / "),
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientNameFilterHeader, {
          column: column as Column<unknown>,
          label: "Winner"
        })
      ]),
    cell: ({ cell, row, table }) => {
      const grouping = table.getState().grouping

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "winning_team") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            h(
              "div",
              {},
              (row.original.winning_team === "t1" ? teams.team1.players : teams.team2.players).map(p =>
                h("div", { key: p.id }, `${p.first_name} ${p.last_name}`)
              )
            )
          ])
        }
      } else if (!grouping.includes("level")) {
        return h(
          "div",
          {},
          (row.original.winning_team === "t1" ? teams.team1.players : teams.team2.players).map(p =>
            h("div", { key: p.id }, `${p.first_name} ${p.last_name}`)
          )
        )
      }
    }
  },
  {
    accessorKey: "level",
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Level"
        }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ]),
    cell: ({ cell, row, table }) => {
      const grouping = table.getState().grouping

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "level") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            h(UBadge, {
              label: row.original.level,
              color: row.original.level,
              class: "w-full"
            })
          ])
        } else {
          const currentGroupingIndex = grouping.indexOf(row.groupingColumnId!)
          const levelGroupingIndex = grouping.indexOf("level")

          if (levelGroupingIndex === -1) {
            const value = cell.getValue<number>()

            return `${value} level${value === 1 ? "" : "s"}`
          } else if (currentGroupingIndex < levelGroupingIndex) {
            const uniqueLevels = useArrayUnique(row.getLeafRows().map(r => r.getValue("level"))).value.filter(Boolean).length

            return `${uniqueLevels} level${uniqueLevels === 1 ? "" : "s"}`
          }
        }
      } else if (!grouping.includes("level")) {
        return h(UBadge, {
          label: row.original.level,
          color: row.original.level,
          class: "w-full"
        })
      }
    }
  },
  {
    accessorKey: "tournament.name",
    aggregationFn: "uniqueCount",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tournament"
        }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ]),
    cell: ({ cell, row, table }) => {
      const grouping = table.getState().grouping

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "tournament_name") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            cell.getValue<string>()
          ])
        } else {
          const currentGroupingIndex = grouping.indexOf(row.groupingColumnId!)
          const tournamentGroupingIndex = grouping.indexOf("tournament_name")

          if (tournamentGroupingIndex === -1) {
            const value = cell.getValue<number>()

            return `${value} tournament${value === 1 ? "" : "s"}`
          } else if (currentGroupingIndex < tournamentGroupingIndex) {
            const uniqueTournaments = useArrayUnique(row.getLeafRows().map(r => r.getValue("tournament_name"))).value.filter(Boolean).length

            return `${uniqueTournaments} tournament${uniqueTournaments === 1 ? "" : "s"}`
          }
        }
      } else if (!grouping.includes("tournament_name")) {
        return cell.renderValue()
      }
    }
  },
  {
    accessorKey: "round",
    aggregationFn: "uniqueCount",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Round"
        }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ]),
    cell: ({ cell, row, table }) => {
      const grouping = table.getState().grouping

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "round") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            cell.getValue<string>()
          ])
        } else {
          const currentGroupingIndex = grouping.indexOf(row.groupingColumnId!)
          const roundGroupingIndex = grouping.indexOf("round")

          if (roundGroupingIndex === -1) {
            const value = cell.getValue<number>()

            return `${value} round${value === 1 ? "" : "s"}`
          } else if (currentGroupingIndex < roundGroupingIndex) {
            const uniqueRounds = useArrayUnique(row.getLeafRows().map(r => r.getValue("round"))).value.filter(Boolean).length

            return `${uniqueRounds} round${uniqueRounds === 1 ? "" : "s"}`
          }
        }
      } else if (!grouping.includes("round")) {
        return cell.renderValue()
      }
    }
  },
  {
    accessorKey: "surface.id",
    aggregationFn: "uniqueCount",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Surface"
        }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ]),
    cell: ({ cell, row, table }) => {
      const grouping = table.getState().grouping

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "surface_id") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            cell.getValue<string>()
          ])
        } else {
          const currentGroupingIndex = grouping.indexOf(row.groupingColumnId!)
          const surfaceGroupingIndex = grouping.indexOf("surface_id")

          if (surfaceGroupingIndex === -1) {
            const value = cell.getValue<number>()

            return `${value} surface${value === 1 ? "" : "s"}`
          } else if (currentGroupingIndex < surfaceGroupingIndex) {
            const uniqueSurfaces = useArrayUnique(row.getLeafRows().map(r => r.getValue("surface_id"))).value.filter(Boolean).length

            return `${uniqueSurfaces} surface${uniqueSurfaces === 1 ? "" : "s"}`
          }
        }
      } else if (!grouping.includes("surface_id")) {
        return cell.renderValue()
      }
    }
  },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h("div", { class: "flex items-center" }, [
          row.original.sets?.[0]?.length &&
            h(
              "div",
              { class: "flex items-center gap-1 mr-2" },
              row.original.sets[0].map((set, index) =>
                h("span", { key: index }, [
                  `${set[0]}${row.original.sets[1]![index]![0]}`,
                  isDefined(set[1]) &&
                    isDefined(row.original.sets[1]![index]![1]) &&
                    h("sup", {}, set[1] < row.original.sets[1]![index]![1] ? set[1] : row.original.sets[1]![index]![1])
                ])
              )
            ),
          row.original.incomplete &&
            h(UBadge, {
              label: row.original.incomplete,
              color: "error"
            })
        ])
      }
    }
  }
]
