import {
  CountryLink,
  PlayerLink,
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  UBadge,
  UButton
} from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper, type Column } from "@tanstack/table-core"
import appConfig from "~/app.config"

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

export const editionColumns: TableColumn<BrokenOutEditionType>[] = [
  {
    accessorKey: "year",
    meta: { class: { td: "text-center" } },
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Year", class: "min-w-fit" }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const value = cell.getValue<number>()
      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "year") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            value
          ])
        } else {
          const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
          const yearGroupingIndex = currentGrouping.indexOf("year")

          if (yearGroupingIndex === -1) {
            return `${value} year${value === 1 ? "" : "s"}`
          } else if (currentGroupingIndex < yearGroupingIndex) {
            const uniqueYears = useArrayUnique(row.getLeafRows().map(r => r.original.year)).value.filter(Boolean).length

            return `${uniqueYears} year${uniqueYears === 1 ? "" : "s"}`
          }
        }
      } else if (!currentGrouping.includes("year")) {
        return value
      }
    },
    footer: ({ table }) => {
      const uniqueCount = Array.from(table.getColumn("year")!.getFacetedUniqueValues().keys()).length
      return uniqueCount ? `${uniqueCount} edition${uniqueCount === 1 ? "" : "s"}` : null
    }
  },
  {
    accessorKey: "category",
    meta: { class: { td: "text-center" } },
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Category", class: "min-w-fit" })
  },
  {
    accessorKey: "start_date",
    meta: { class: { td: "text-center" } },
    header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Dates" }),
    cell: ({ row, table }) => {
      const { start_date, end_date } = row.original
      if (start_date && end_date) {
        if ((row.getIsGrouped() && row.groupingColumnId === "year") || (!row.getIsGrouped() && !table.getState().grouping.includes("year"))) {
          if (mdAndDown.value) {
            return shortDateFormat.formatRange(new Date(start_date), new Date(end_date))
          } else {
            return dateTimeFormat.formatRange(new Date(start_date), new Date(end_date))
          }
        }
      }
    }
  },
  {
    accessorKey: "surface.id",
    meta: { class: { td: "text-center" } },
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Surface", class: "min-w-fit" })
  },
  {
    accessorKey: "venues",
    header: "Venues",
    cell: ({ row }) => {
      const { venues } = row.original
      if (!row.getIsGrouped()) {
        return h(
          "div",
          { class: "flex flex-col gap-0.5" },
          venues.map(venue =>
            h("div", { class: "flex items-center gap-1" }, [
              h("span", {}, venue.name ? `${venue.name}, ${venue.city}` : venue.city),
              h(CountryLink, { country: venue.country, iconOnly: true })
            ])
          )
        )
      }
    }
  },
  {
    accessorKey: "tfc",
    header: "TFC",
    cell: ({ row, table }) => {
      const { tfc, currency } = row.original

      if (tfc && currency) {
        if ((row.getIsGrouped() && row.groupingColumnId === "year") || (!row.getIsGrouped() && !table.getState().grouping.includes("year"))) {
          return tfc.toLocaleString("en-GB", { style: "currency", currency })
        }
      }
    }
  },
  {
    accessorKey: "winner.tour",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Tour(s)", class: "min-w-fit" })
      ]),
    cell: ({ row, table }) => {
      const currentGrouping = table.getState().grouping
      const { winner, tours } = row.original
      if (row.getIsGrouped() && row.groupingColumnId === "winner_tour") {
        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          winner && typeof winner === "object" && "tour" in winner
            ? h(UBadge, {
                label: (winner as { tour: string }).tour,
                color: (winner as { tour: keyof typeof appConfig.ui.colors }).tour
              })
            : tours.map(tour => h(UBadge, { label: tour, color: tour as keyof typeof appConfig.ui.colors }))
        ])
      } else if (!row.getIsGrouped() && !currentGrouping.includes("winner_tour")) {
        if (winner && typeof winner === "object" && "tour" in winner) {
          return h(UBadge, {
            label: (winner as { tour: string }).tour,
            color: (winner as { tour: keyof typeof appConfig.ui.colors }).tour
          })
        } else {
          return h(
            "div",
            { class: "flex items-center gap-1" },
            tours.map(tour => h(UBadge, { label: tour, color: tour as keyof typeof appConfig.ui.colors }))
          )
        }
      }
    }
  },
  {
    accessorKey: "winner.type",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, { column: column as Column<unknown>, label: "S/D", class: "min-w-fit" })
      ]),
    cell: ({ row, table }) => {
      const currentGrouping = table.getState().grouping
      const { winner } = row.original
      if (row.getIsGrouped() && row.groupingColumnId === "winner_type") {
        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          winner &&
            typeof winner === "object" &&
            "type" in winner &&
            h(UBadge, {
              label: (winner as { type: string }).type,
              color: (winner as { type: keyof typeof appConfig.ui.colors }).type
            })
        ])
      } else if (!row.getIsGrouped() && !currentGrouping.includes("winner_type")) {
        if (winner && typeof winner === "object" && "type" in winner) {
          return h(UBadge, {
            label: (winner as { type: string }).type,
            color: (winner as { type: keyof typeof appConfig.ui.colors }).type
          })
        }
      }
    }
  },
  {
    id: "winner",
    accessorFn: row => {
      const winner = row.winner as any
      if ("name" in winner) {
        return winner.name
      } else {
        return ((row.winner as any).team as any[]).map((player: any) => `${player.last_name}, ${player.first_name}`).join(" / ")
      }
    },
    aggregationFn: "uniqueCount",
    header: ({ column }) => {
      const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()).filter(Boolean).sort()

      return h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        uniqueValues[0]?.includes(", ")
          ? h(TableClientNameFilterHeader, {
              column: column as Column<unknown>,
              label: "Winner(s)",
              class: "min-w-fit"
            })
          : h(TableClientFilterHeader, {
              column: column as Column<unknown>,
              label: "Winner(s)",
              class: "min-w-fit"
            }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ])
    },
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const { winner } = row.original

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "winner") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            winner &&
              typeof winner === "object" &&
              ("name" in winner
                ? h(CountryLink, {
                    country: winner
                  })
                : h(
                    "div",
                    { class: "flex flex-col gap-1" },
                    winner.team.map((player: PersonType) => h(PlayerLink, { key: player.id, player: player }))
                  ))
          ])
        } else {
          const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
          const winnerGroupingIndex = currentGrouping.indexOf("winner")

          if (winnerGroupingIndex === -1) {
            const value = cell.getValue<number>()
            return `${value} winner${value !== 1 ? "s" : ""}`
          } else if (currentGroupingIndex < winnerGroupingIndex) {
            const uniqueWinners = useArrayUnique(row.getLeafRows().map(r => r.getValue("winner"))).value.filter(Boolean).length

            return `${uniqueWinners} winner${uniqueWinners !== 1 ? "s" : ""}`
          }
        }
      } else if (!currentGrouping.includes("winner")) {
        if (winner && typeof winner === "object" && "name" in winner) {
          return h(CountryLink, {
            country: winner
          })
        } else if (winner && typeof winner === "object" && "team" in winner) {
          return h(
            "div",
            { class: "flex flex-col gap-1" },
            winner.team.map((player: PersonType) => h(PlayerLink, { key: player.id, player: player }))
          )
        }
      }
    },
    footer: ({ table }) => {
      const uniqueValues = Array.from(table.getColumn("winner")!.getFacetedUniqueValues().keys()).flatMap(value =>
        value.includes("/") ? value.split(" / ") : value
      )

      const uniqueCount = useArrayUnique(uniqueValues).value.filter(Boolean).length

      return uniqueCount ? `${uniqueCount} winner${uniqueCount === 1 ? "" : "s"}` : null
    }
  }
]

const resultsColumnHelper = createColumnHelper<ResultMatchType>()

export const resultsColumns: TableColumn<ResultMatchType>[] = [
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
    cell: ({ row, table }) => {
      const currentGrouping = table.getState().grouping
      const { tour } = row.original

      if (row.getIsGrouped()) {
        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          h(UBadge, {
            label: tour,
            color: tour as keyof typeof appConfig.ui.colors
          })
        ])
      } else if (!currentGrouping.includes("tour")) {
        return h(UBadge, {
          label: tour,
          color: tour as keyof typeof appConfig.ui.colors,
          class: "w-full"
        })
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
    cell: ({ row, table }) => {
      const currentGrouping = table.getState().grouping
      const { type } = row.original

      if (row.getIsGrouped()) {
        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          h(UBadge, {
            label: type,
            color: type as keyof typeof appConfig.ui.colors
          })
        ])
      } else if (!currentGrouping.includes("type")) {
        return h(UBadge, {
          label: type,
          color: type as keyof typeof appConfig.ui.colors,
          class: "w-full"
        })
      }
    }
  },
  {
    accessorKey: "round",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Round"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ])
  },
  {
    accessorKey: "date",
    sortUndefined: 1,
    header: ({ column }) =>
      h(TableClientSortHeader, {
        column: column as Column<unknown>,
        label: "Date"
      }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() && row.original.date) {
        return useDateFormat(row.original.date, "dddd MMMM DD YYYY").value
      }
    }
  },
  {
    accessorKey: "duration",
    sortUndefined: 1,
    meta: { class: { td: "text-center" } },
    header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Duration" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() && row.original.duration) {
        return getDurationString(row.original.duration)
      }
    }
  },
  {
    accessorKey: "court",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Court",
          icon: ICONS.court
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ])
  },
  {
    id: "umpire",
    accessorKey: "umpire.id",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Umpire",
          icon: ICONS.umpire
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ])
  },
  resultsColumnHelper.group({
    id: "Winner",
    header: () => h(UBadge, { label: "Winner", color: "success", class: "w-full" }),
    columns: [
      {
        id: "winner_team",
        accessorFn: row => row.winner.team.map(p => `${p.last_name}, ${p.first_name}`).join(" / "),
        header: ({ column }) =>
          h("div", { class: "flex items-center gap-0.5 justify-center" }, [
            h(TableClientNameFilterHeader, {
              column: column as Column<unknown>,
              label: "Team",
              icon: ICONS.player
            }),
            h(TableClientSortHeader, {
              column: column as Column<unknown>
            })
          ]),
        cell: ({ row }) => {
          if (!row.getIsGrouped()) {
            const { winner } = row.original
            return winner.team.map(p =>
              h(PlayerLink, {
                key: p.id,
                player: p
              })
            )
          }
        }
      },
      {
        id: "winner_status",
        accessorFn: row => {
          const statuses: (string | number)[] = []

          const { seed, q_seed, status, q_status } = row.winner
          const { round } = row

          if (round.includes("Qualifying")) {
            if (q_seed) statuses.push(q_seed)
            if (q_status) statuses.push(statusEnum[q_status])
          } else {
            if (seed) statuses.push(seed)
            if (status) statuses.push(statusEnum[status])
          }

          return statuses.join(" / ")
        },
        meta: { class: { td: "text-center" } },
        header: "Seed/Status"
      },
      {
        id: "winner_rank",
        accessorFn: row => row.winner.team.reduce((acc, player) => acc + (player.rank ?? 0), 0),
        aggregationFn: "mean",
        meta: { class: { td: "text-center" } },
        header: "Rank",
        cell: ({ row, cell }) => {
          const value = cell.getValue<number>()

          if (row.getIsGrouped()) {
            return Math.round(value)
          } else {
            return value
          }
        }
      }
    ]
  }),
  resultsColumnHelper.group({
    id: "loser",
    header: () => h(UBadge, { label: "Loser", color: "ITF", class: "w-full" }),
    columns: [
      {
        id: "loser_team",
        accessorFn: row => row.loser.team.map(p => `${p.last_name}, ${p.first_name}`).join(" / "),
        header: ({ column }) =>
          h("div", { class: "flex items-center gap-0.5 justify-center" }, [
            h(TableClientNameFilterHeader, {
              column: column as Column<unknown>,
              label: "Team",
              icon: ICONS.player
            }),
            h(TableClientSortHeader, {
              column: column as Column<unknown>
            })
          ]),
        cell: ({ row }) => {
          if (!row.getIsGrouped()) {
            const { loser } = row.original
            return loser.team.map(p =>
              h(PlayerLink, {
                key: p.id,
                player: p
              })
            )
          }
        }
      },
      {
        id: "loser_status",
        accessorFn: row => {
          const statuses: (string | number)[] = []

          const { seed, q_seed, status, q_status } = row.loser
          const { round } = row

          if (round.includes("Qualifying")) {
            if (q_seed) statuses.push(q_seed)
            if (q_status) statuses.push(statusEnum[q_status])
          } else {
            if (seed) statuses.push(seed)
            if (status) statuses.push(statusEnum[status])
          }

          return statuses.join(" / ")
        },
        meta: { class: { td: "text-center" } },
        header: "Seed/Status"
      },
      {
        id: "loser_rank",
        accessorFn: row => row.loser.team.reduce((acc, player) => acc + (player.rank ?? 0), 0),
        aggregationFn: "mean",
        header: "Rank",
        meta: { class: { td: "text-center" } },
        cell: ({ row, cell }) => {
          const value = cell.getValue<number>()

          if (row.getIsGrouped()) {
            return Math.round(value)
          } else {
            return value
          }
        }
      }
    ]
  }),
  {
    id: "score",
    header: "Score",
    cell: ({ row }) => {
      if (!row.getIsGrouped() && row.original.sets?.[0]?.length) {
        return h("div", { class: "flex items-center" }, [
          h(
            "div",
            { class: "flex items-center gap-1 mr-2" },
            row.original.sets?.[0].map((set, index) =>
              h(
                "span",
                {
                  key: index
                },
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
        ])
      }
    }
  },
  {
    id: "h2h",
    header: "",
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(UButton, {
          label: "H2H",
          icon: ICONS.h2h,
          to: {
            name: "h2h",
            query: {
              team1: `${row.original.winner.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join("+")}:${row.original.winner.team
                .map(p => p.id)
                .join("+")}`,
              team2: `${row.original.loser.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join("+")}:${row.original.loser.team
                .map(p => p.id)
                .join("/")}`
            }
          }
        })
      }
    }
  }
]
