import {
  PlayerLink,
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  UBadge,
  UButton,
  UIcon,
  UInputMenu,
  ULink,
  UProgress
} from "#components"
import type { TableColumn } from "@nuxt/ui"
import { type Column } from "@tanstack/vue-table"
import appConfig from "~/app.config"

export const activityCardColumns = (event: ConsolidatedActivityType, id: string, name: string): TableColumn<ActivityMatchType>[] => [
  { accessorKey: "round", header: "Round" },
  {
    accessorKey: "winning_team",
    header: "",
    cell: ({ row }) =>
      h(UIcon, {
        name: row.original.winning_team === "t1" ? appConfig.ui.icons.success : appConfig.ui.icons.error,
        class: (row.original.winning_team === "t1" ? "text-success" : "text-error") + " text-lg"
      })
  },
  {
    id: "opponent",
    header: "Opponent",
    cell: ({ row }) => {
      if (row.original.opponent?.team.length) {
        return h(
          "div",
          { class: "flex flex-col" },
          row.original.opponent.team.map(p => h(PlayerLink, { player: p }))
        )
      } else {
        return "BYE"
      }
    }
  },
  {
    id: "rank",
    header: "Rank",
    cell: ({ row }) => {
      const { opponent } = row.original
      if (opponent?.team.length) {
        if (opponent.team.length === 1) {
          return opponent.team[0]!.rank?.toLocaleString() ?? "—"
        } else {
          return h("div", { class: "flex items-center justify-center gap-2" }, [
            h(
              "div",
              { class: "flex flex-col items-center" },
              opponent.team.map(player => h("div", {}, player.rank ?? "—"))
            ),
            h("div", {}, `[${opponent.team.reduce((sum, player) => sum + (player.rank ?? 0), 0)}]`)
          ])
        }
      } else {
        return "—"
      }
    }
  },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex items-center" },
        [
          row.original.sets?.[0]?.length &&
            h(
              "div",
              { class: "flex items-center gap-1 mr-2" },
              row.original.sets[0].map((set, index) =>
                h(
                  "span",
                  { key: index },
                  [
                    `${set[0]}${row.original.sets![1]![index]![0]}`,
                    isDefined(set[1]) &&
                      isDefined(row.original.sets![1]![index]![1]) &&
                      h("sup", {}, set[1] < row.original.sets![1]![index]![1] ? set[1] : row.original.sets![1]![index]![1])
                  ].filter(Boolean)
                )
              )
            ),
          row.original.incomplete &&
            h(UBadge, {
              label: row.original.incomplete,
              color: "error"
            })
        ].filter(Boolean)
      )
  },
  {
    id: "h2h",
    header: "",
    cell: ({ row }) => {
      if (row.original.opponent?.team.length) {
        const { partner } = event
        const {
          opponent: { team }
        } = row.original
        const p1Name = partner ? `${name}+${kebabCase(partner.first_name)}-${kebabCase(partner.last_name)}` : name
        const p1Id = partner ? `${id}+${partner.id}` : id

        const p2Name = team.map(player => `${kebabCase(player.first_name)}-${kebabCase(player.last_name)}`).join("+")
        const p2Id = team.map(player => player.id).join("+")

        return h(UButton, {
          to: {
            name: "h2h",
            query: {
              team1: `${p1Name}:${p1Id}`,
              team2: `${p2Name}:${p2Id}`
            }
          },
          label: "H2H",
          icon: ICONS.h2h,
          block: true
        })
      }
    }
  }
]

export const activityColumns = (name: string, id: string): TableColumn<ActivityType>[] => [
  {
    accessorKey: "year",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Year",
          class: "min-w-fit"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        const { tournament, year, id } = row.original

        return h(
          ULink,
          {
            class: "hover-link default-link",
            to: {
              name: "edition",
              params: {
                id: tournament.id,
                name: kebabCase(tournament.name),
                year,
                edId: id
              }
            }
          },
          () => year
        )
      }
    }
  },
  {
    accessorKey: "level",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Level",
          class: "min-w-fit"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(UBadge, { label: row.original.level, color: row.original.level, class: "w-full" })
      }
    }
  },
  {
    accessorKey: "tournament.name",
    aggregationFn: "uniqueCount",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tournament",
          class: "min-w-fit"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const {
        tournament: { id, name }
      } = row.original
      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "tournament_name") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            h(
              ULink,
              {
                class: "hover-link default-link",
                to: {
                  name: "tournament",
                  params: { id, name: kebabCase(name) }
                }
              },
              () => name
            )
          ])
        } else {
          const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
          const tournamentGroupingIndex = currentGrouping.indexOf("tournament_name")

          if (tournamentGroupingIndex === -1) {
            const value = cell.getValue<number>()

            return `${value} tournament${value !== 1 ? "s" : ""}`
          } else if (currentGroupingIndex < tournamentGroupingIndex) {
            const uniqueTournaments = useArrayUnique(row.getLeafRows().map(r => r.original.tournament.id)).value.length
            return `${uniqueTournaments} tournament${uniqueTournaments !== 1 ? "s" : ""}`
          }
        }
      } else if (!currentGrouping.includes("tournament_name")) {
        return h(
          ULink,
          {
            class: "hover-link default-link",
            to: {
              name: "tournament",
              params: { id, name: kebabCase(name) }
            }
          },
          () => name
        )
      }
    }
  },
  {
    accessorKey: "category",
    meta: { class: { td: "text-center" } },
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Category",
          class: "min-w-fit"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const { category } = row.original
      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "category") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            category
          ])
        } else {
          const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
          const categoryGroupingIndex = currentGrouping.indexOf("category")

          if (categoryGroupingIndex === -1) {
            const value = cell.getValue<number>()

            return `${value} categor${value !== 1 ? "ies" : "y"}`
          } else if (currentGroupingIndex < categoryGroupingIndex) {
            const uniqueCategories = useArrayUnique(row.getLeafRows().map(r => r.original.category)).value.length
            return `${uniqueCategories} categor${uniqueCategories !== 1 ? "ies" : "y"}`
          }
        }
      } else if (!currentGrouping.includes("category")) {
        return category
      }
    }
  },
  {
    accessorKey: "start_date",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h(TableClientSortHeader, {
        column: column as Column<unknown>,
        label: "Dates"
      }),
    cell: ({ row }) => {
      const {
        match: { date },
        start_date,
        end_date
      } = row.original

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "tournament_name" || row.groupingColumnId === "category") {
          return dateTimeFormat.formatRange(new Date(start_date), new Date(end_date))
        }
      } else {
        return useDateFormat(date, "DD MMMM YYYY").value
      }
    }
  },
  {
    accessorKey: "match.round",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Round",
          class: "min-w-fit"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ row }) => {
      const {
        match: { round },
        tournament: { id, name },
        year,
        id: edId
      } = row.original

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "tournament_name" || row.groupingColumnId === "category") {
          return h(
            ULink,
            {
              class: "hover-link default-link",
              to: {
                name: "edition",
                params: {
                  id,
                  name: kebabCase(name),
                  year,
                  edId
                }
              }
            },
            () => year
          )
        }
      } else {
        return round
      }
    }
  },
  {
    id: "partner",
    aggregationFn: "uniqueCount",
    accessorFn: row => (row.partner ? `${row.partner.last_name}, ${row.partner.first_name}` : ""),
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientNameFilterHeader, {
          column: column as Column<unknown>,
          label: "Partner",
          class: "min-w-fit"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const { partner } = row.original

      if (partner) {
        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "partner") {
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              h(PlayerLink, { player: partner })
            ])
          } else {
            const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
            const partnerGroupingIndex = currentGrouping.indexOf("partner")

            if (partnerGroupingIndex === -1) {
              const value = cell.getValue<number>()

              return `${value} partner${value !== 1 ? "s" : ""}`
            } else if (currentGroupingIndex < partnerGroupingIndex) {
              const uniquePartners = useArrayUnique(row.getLeafRows().map(r => r.original.partner?.id)).value.filter(Boolean).length

              return `${uniquePartners} partner${uniquePartners !== 1 ? "s" : ""}`
            }
          }
        } else if (!currentGrouping.includes("partner")) {
          return h(PlayerLink, { player: partner })
        }
      }
    }
  },
  {
    accessorKey: "match.winning_team",
    meta: { class: { td: "text-center" } },
    header: "",
    cell: ({ row }) => {
      const {
        match: { winning_team },
        level
      } = row.original

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "tournament_name" || row.groupingColumnId === "category") {
          return h(UBadge, {
            label: level,
            color: level
          })
        }
      } else {
        if (winning_team === "t1") {
          return h(UIcon, { name: appConfig.ui.icons.success, class: "text-success" })
        } else {
          return h(UIcon, { name: appConfig.ui.icons.error, class: "text-error" })
        }
      }
    }
  },
  {
    id: "opponent",
    accessorFn: row =>
      row.match.opponent?.team.length ? row.match.opponent?.team.map(player => `${player.last_name}, ${player.first_name}`).join(" / ") : undefined,
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientNameFilterHeader, {
          column: column as Column<unknown>,
          label: "Opponent",
          class: "min-w-fit"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const {
        match: { opponent }
      } = row.original

      if (opponent?.team.length) {
        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "opponent") {
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              h(
                "div",
                { class: "flex flex-col" },
                opponent.team.map(player => h(PlayerLink, { player }))
              )
            ])
          } else {
            const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
            const opponentGroupingIndex = currentGrouping.indexOf("opponent")

            if (opponentGroupingIndex === -1) {
              const value = cell.getValue<number>()

              return `${value} opponent${value !== 1 ? "s" : ""}`
            } else if (currentGroupingIndex < opponentGroupingIndex) {
              const uniqueOpponents = useArrayUnique(
                row.getLeafRows().map(r => r.original.match.opponent?.team.map(player => player.id))
              ).value.filter(Boolean).length

              return `${uniqueOpponents} opponent${uniqueOpponents !== 1 ? "s" : ""}`
            }
          }
        } else if (!currentGrouping.includes("opponent")) {
          if (opponent.team.length) {
            return h(
              "div",
              { class: "flex flex-col" },
              opponent.team.map(player => h(PlayerLink, { player }))
            )
          } else {
            return "BYE"
          }
        }
      }
    }
  },
  {
    id: "rank",
    accessorFn: row => (row.match.opponent?.team.length ? row.match.opponent?.team.reduce((acc, player) => acc + (player.rank ?? 0), 0) : undefined),
    aggregationFn: "mean",
    meta: { class: { td: "text-center" } },
    header: "Rank",
    cell: ({ cell, row }) => {
      const value = cell.getValue<number>()

      if (row.getIsGrouped()) {
        return value ? `Avg: ${Math.round(value)}` : "—"
      } else {
        if (value) {
          if (row.original.match.opponent!.team.length === 1) {
            return value
          }

          return h("div", { class: "flex items-center justify-center gap-2" }, [
            h(
              "div",
              { class: "flex flex-col items-center" },
              row.original.match.opponent!.team.map(player => h("div", {}, player.rank ?? "—"))
            ),
            h("div", {}, `[${value}]`)
          ])
        } else {
          return "—"
        }
      }
    }
  },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(
          "div",
          { class: "flex justify-center items-center" },
          [
            row.original.match.sets?.[0]?.length &&
              h(
                "div",
                { class: "flex items-center gap-1 mr-2" },
                row.original.match.sets[0].map((set, index) =>
                  h(
                    "span",
                    { key: index },
                    [
                      `${set[0]}${row.original.match.sets![1]![index]![0]}`,
                      isDefined(set[1]) &&
                        isDefined(row.original.match.sets![1]![index]![1]) &&
                        h("sup", {}, set[1] < row.original.match.sets![1]![index]![1] ? set[1] : row.original.match.sets![1]![index]![1])
                    ].filter(Boolean)
                  )
                )
              ),
            row.original.match.incomplete &&
              h(UBadge, {
                label: row.original.match.incomplete,
                color: "error"
              })
          ].filter(Boolean)
        )
      }
    }
  },
  {
    id: "h2h",
    header: "",
    cell: ({ row }) => {
      if (!row.getIsGrouped() && row.original.match.opponent?.team.length) {
        const {
          partner,
          match: {
            opponent: { team }
          }
        } = row.original
        const p1Name = partner ? `${name}+${kebabCase(partner.first_name)}-${kebabCase(partner.last_name)}` : name
        const p1Id = partner ? `${id}+${partner.id}` : id

        const p2Name = team.map(player => `${kebabCase(player.first_name)}-${kebabCase(player.last_name)}`).join("+")
        const p2Id = team.map(player => player.id).join("+")

        return h(UButton, {
          to: {
            name: "h2h",
            query: {
              team1: `${p1Name}:${p1Id}`,
              team2: `${p2Name}:${p2Id}`
            }
          },
          label: "H2H",
          icon: ICONS.h2h,
          block: true
        })
      }
    }
  }
]

export const wlIndexColumns: TableColumn<WLIndexType>[] = [
  {
    accessorKey: "category",
    meta: { class: { th: "text-center" } },
    header: "Category",
    cell: ({ cell, row }) => {
      if (row.getIsGrouped()) {
        return h("div", { class: "flex items-center" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          cell.getValue<string>()
        ])
      }
    }
  },
  { accessorKey: "stat", header: "Stat" },
  { id: "wl", accessorFn: row => `${row.wins}-${row.losses}`, meta: { class: { th: "text-center", td: "text-center" } }, header: "Win-Loss" },
  {
    accessorKey: "value",
    aggregationFn: "mean",
    meta: { class: { th: "text-center", td: "text-center" } },
    header: "Index",
    cell: ({ cell, row, table }) => {
      let value = 0

      if (row.getIsGrouped()) {
        if (row.getValue("category") === "Match record") {
          value = table.getRow("0").getValue("value")
        } else {
          value = cell.getValue<number>()
        }
      } else {
        value = cell.getValue<number>()
      }

      return h(
        UProgress,
        {
          modelValue: value,
          max: 1,
          ui: {
            root: "min-w-60 md:min-w-sm",
            base: "bg-Inactive-300 dark:bg-Inactive-800",
            indicator: "bg-Inactive-600 dark:bg-Inactive-500"
          }
        },
        { status: () => value.toFixed(3) }
      )
    }
  },
  {
    accessorKey: "titles",
    meta: { class: { th: "text-center", td: "text-center" } },
    header: "Titles",
    cell: ({ cell, row, table }) => {
      const categoryValue: string = row.getValue("category")
      if (row.getIsGrouped() && categoryValue === "Match record") {
        const value = table.getRow("0").getValue("titles")

        return `${value} title${value !== 1 ? "s" : ""}`
      } else if (!row.getIsGrouped()) {
        const value = cell.getValue<number>()
        return value
      }
    }
  }
]

export const playerStatsColumns: TableColumn<PlayerStatsType>[] = [
  { accessorKey: "stat", header: "" },
  {
    accessorKey: "value",
    meta: { class: { td: "text-right" } },
    header: "",
    cell: ({ row }) => {
      if (row.original.percent) {
        return h(UProgress, {
          modelValue: row.original.value,
          max: 100,
          status: true,
          ui: {
            root: "min-w-60 md:min-w-sm",
            base: "bg-Inactive-300 dark:bg-Inactive-800",
            indicator: "bg-Inactive-600 dark:bg-Inactive-500"
          }
        })
      } else {
        return row.original.value
      }
    }
  }
]
