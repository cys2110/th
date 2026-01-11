import {
  FiltersTours,
  PlayerLink,
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  TableServerFilterHeader,
  TableServerFilterSearchHeader,
  TableServerSortHeader,
  UBadge,
  UButton,
  UIcon,
  ULink
} from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper, type Column, type Table } from "@tanstack/vue-table"
import appConfig from "~/app.config"

export const tournamentColumns = (
  tours: Ref<string[] | null | undefined>,
  tournaments: Ref<OptionType[] | null | undefined>,
  established: Ref<number | undefined>,
  abolished: Ref<number | undefined>,
  sortField: Ref<SortFieldType[] | undefined>
): TableColumn<TournamentType>[] => [
  {
    accessorKey: "tours",
    header: () =>
      h(FiltersTours, {
        orientation: "horizontal",
        modelValue: tours.value,
        "onUpdate:modelValue": (val: string[] | undefined) => {
          tours.value = val || []
        }
      }),
    cell: ({ row }) =>
      row.original.tours.map(tour => h(UBadge, { key: tour, label: tour, color: tour as keyof typeof appConfig.ui.colors, class: "mx-0.5" }))
  },
  {
    accessorKey: "name",
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerFilterSearchHeader, {
          label: "Tournament",
          type: "Tournament",
          multiple: true,
          icon: ICONS.trophy,
          modelValue: tournaments.value ?? [],
          "onUpdate:modelValue": (val: OptionType | OptionType[] | null | undefined) => {
            tournaments.value = val as OptionType[]
          }
        }),
        h(TableServerSortHeader, {
          sortKey: "name",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ])
  },
  {
    accessorKey: "established",
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerFilterHeader, {
          label: "Established",
          icon: ICONS.years,
          items: Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i),
          modelValue: established.value,
          "onUpdate:modelValue": (val: number | undefined) => {
            established.value = val as number
          }
        }),
        h(TableServerSortHeader, {
          sortKey: "established",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ])
  },
  {
    accessorKey: "abolished",
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerFilterHeader, {
          label: "Abolished",
          icon: ICONS.years,
          items: Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i),
          modelValue: abolished.value,
          "onUpdate:modelValue": (val: number | undefined) => {
            abolished.value = val as number
          }
        }),
        h(TableServerSortHeader, {
          sortKey: "abolished",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ])
  }
]

export const tournamentAwardsColumns = (): TableColumn<TournamentPmType>[] => {
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
        const currentGrouping = table.getState().grouping
        const value = cell.getValue<keyof typeof appConfig.ui.colors>()

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "tour") {
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              h(UBadge, { color: value, label: value })
            ])
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
        const currentGrouping = table.getState().grouping
        const value = cell.getValue<keyof typeof appConfig.ui.colors>()

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "type") {
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              h(UBadge, { color: value, label: value })
            ])
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
          }
        } else if (!currentGrouping.includes("year")) {
          return value
        }
      }
    },
    {
      accessorKey: "round",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientFilterHeader, {
            column: column as Column<unknown>,
            label: "Round",
            icon: ICONS.category
          }),
          h(TableClientSortHeader, {
            column: column as Column<unknown>
          })
        ]),
      cell: ({ cell, row, table }) => {
        const currentGrouping = table.getState().grouping
        const value = cell.getValue<string>()

        if (row.getIsGrouped() && row.groupingColumnId === "round") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            value
          ])
        } else if (!currentGrouping.includes("round")) {
          return value
        }
      }
    },
    {
      accessorKey: "pm",
      header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Prize Money" }),
      cell: ({ cell, row }) => {
        const value = cell.getValue<number>()
        if (!row.getIsGrouped() && isDefined(value)) {
          return value.toLocaleString("en-GB", { style: "currency", currency: row.original.currency ?? "USD" })
        }
      }
    },
    {
      accessorKey: "points",
      header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Points" }),
      cell: ({ cell, row }) => {
        const value = cell.getValue<number>()
        if (!row.getIsGrouped() && isDefined(value)) {
          return value.toLocaleString()
        }
      }
    }
  ]
}

const finalistsColumnHelper = createColumnHelper<TournamentFinalistType>()
export const tournamentFinalistsColumns = (): TableColumn<TournamentFinalistType>[] => {
  return [
    {
      accessorKey: "tour",
      header: ({ column }) =>
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tour",
          icon: ICONS.tour
        }),
      cell: ({ cell }) => h(UBadge, { color: cell.getValue<keyof typeof appConfig.ui.colors>(), label: cell.getValue<string>() })
    },
    {
      id: "player",
      accessorFn: row => `${row.last_name}, ${row.first_name}`,
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientNameFilterHeader, {
            column: column as Column<unknown>,
            label: "Player",
            icon: ICONS.player
          }),
          h(TableClientSortHeader, {
            column: column as Column<unknown>
          })
        ]),
      cell: ({ row }) =>
        h(PlayerLink, {
          player: {
            id: row.original.id,
            first_name: row.original.first_name,
            last_name: row.original.last_name,
            country: row.original.country
          }
        })
    },
    finalistsColumnHelper.group({
      header: "Singles",
      columns: [
        {
          id: "singles_wl",
          header: "Win-Loss",
          cell: ({ row }) => `${row.original.singles_wins}-${row.original.singles_losses}`
        },
        {
          id: "singles_pc",
          accessorFn: row => percentage(row.singles_wins, row.singles_wins + row.singles_losses),
          header: ({ column }) =>
            h(TableClientSortHeader, {
              column: column as Column<unknown>,
              label: "Win %"
            }),
          cell: ({ cell }) => `${Math.round(cell.getValue<number>())}%`
        }
      ]
    }),
    finalistsColumnHelper.group({
      header: "Doubles",
      columns: [
        {
          id: "doubles_wl",
          header: "Win-Loss",
          cell: ({ row }) => `${row.original.doubles_wins}-${row.original.doubles_losses}`
        },
        {
          id: "doubles_pc",
          accessorFn: row => percentage(row.doubles_wins, row.doubles_wins + row.doubles_losses),
          header: ({ column }) =>
            h(TableClientSortHeader, {
              column: column as Column<unknown>,
              label: "Win %"
            }),
          cell: ({ cell }) => `${Math.round(cell.getValue<number>())}%`
        }
      ]
    })
  ]
}

const countryColumnHelper = createColumnHelper<TournamentCountryType>()
export const tournamentCountryColumns = (): TableColumn<TournamentCountryType>[] => {
  const tournamentStore = useTournamentStore()

  return [
    {
      accessorKey: "name",
      header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Country", icon: ICONS.globe }),
      cell: ({ row }) => h("div", { class: "flex items-center gap-2" }, [h(UIcon, { name: getFlagCode(row.original) }), row.original.name])
    },
    ...tournamentStore.tours.map(tour =>
      countryColumnHelper.group({
        id: tour,
        header: () => {
          if (tournamentStore.tours.length > 1) {
            return h(UBadge, { color: tour as keyof typeof appConfig.ui.colors, label: tour, class: "w-full" })
          }
        },
        columns: [
          countryColumnHelper.group({
            header: "No. of Players",
            columns: [
              {
                accessorKey: `${tour}.distinct_singles_wins`,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { color: "Singles", label: "Singles", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              },
              {
                accessorKey: `${tour}.distinct_doubles_wins`,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { color: "Doubles", label: "Doubles", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              },
              {
                id: `${tour}_total_wins`,
                accessorFn: row => row[tour as keyof typeof row]!.distinct_singles_wins + row[tour as keyof typeof row]!.distinct_doubles_wins,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { label: "Total", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              }
            ]
          }),
          countryColumnHelper.group({
            header: "Total Wins",
            columns: [
              {
                accessorKey: `${tour}.singles_wins`,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { color: "Singles", label: "Singles", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              },
              {
                accessorKey: `${tour}.doubles_wins`,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { color: "Doubles", label: "Doubles", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              },
              {
                id: `${tour}_total_wins`,
                accessorFn: row => row[tour as keyof typeof row]!.singles_wins + row[tour as keyof typeof row]!.doubles_wins,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { label: "Total", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              }
            ]
          })
        ]
      })
    )
  ]
}

const scoresStatsColumnHelper = createColumnHelper<TournamentScoresStatsType>()
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
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              h(UBadge, { color: value, label: value })
            ])
          }
        } else if (!currentGrouping.includes("tour")) {
          return h(UBadge, { color: value, label: value })
        }
      }
    },
    {
      accessorKey: "year",
      aggregationFn: "uniqueCount",
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
            ])
          } else {
            const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
            const yearGroupingIndex = currentGrouping.indexOf("year")

            if (yearGroupingIndex === -1) {
              const value = cell.getValue<number>()

              return `${value} year${value !== 1 ? "s" : ""}`
            } else if (currentGroupingIndex < yearGroupingIndex) {
              const uniqueYears = useArrayUnique(row.getLeafRows().map(r => r.original.year)).value.length
              return `${uniqueYears} year${uniqueYears !== 1 ? "s" : ""}`
            }
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
      aggregationFn: "uniqueCount",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
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
      cell: ({ cell, row, table }) => {
        const currentGrouping = table.getState().grouping

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "team") {
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              row.original.team.map(player =>
                h(PlayerLink, {
                  key: player.id,
                  player
                })
              )
            ])
          } else {
            const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
            const teamGroupingIndex = currentGrouping.indexOf("team")

            if (teamGroupingIndex === -1) {
              const value = cell.getValue<number>()

              return `${value} team${value !== 1 ? "s" : ""}`
            } else if (currentGroupingIndex < teamGroupingIndex) {
              const uniqueTeams = useArrayUnique(row.getLeafRows().map(r => r.getValue("team"))).value.length
              return `${uniqueTeams} team${uniqueTeams !== 1 ? "s" : ""}`
            }
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
    scoresStatsColumnHelper.group({
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
    scoresStatsColumnHelper.group({
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
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              h(UBadge, { color: value, label: value })
            ])
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
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              h(UBadge, { color: value, label: value })
            ])
          }
        } else if (!currentGrouping.includes("type")) {
          return h(UBadge, { color: value, label: value })
        }
      }
    },
    {
      accessorKey: "year",
      aggregationFn: "uniqueCount",
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
            ])
          } else {
            const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
            const yearGroupingIndex = currentGrouping.indexOf("year")

            if (yearGroupingIndex === -1) {
              const value = cell.getValue<number>()

              return `${value} year${value !== 1 ? "s" : ""}`
            } else if (currentGroupingIndex < yearGroupingIndex) {
              const uniqueYears = useArrayUnique(row.getLeafRows().map(r => r.original.year)).value.length
              return `${uniqueYears} year${uniqueYears !== 1 ? "s" : ""}`
            }
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
      aggregationFn: "uniqueCount",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
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
      cell: ({ cell, row, table }) => {
        const currentGrouping = table.getState().grouping

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "player") {
            return h("div", { class: "flex items-center py-1" }, [
              h(UButton, {
                variant: "ghost",
                class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
                icon: appConfig.ui.icons.chevronDoubleRight,
                onClick: () => row.toggleExpanded()
              }),
              h(PlayerLink, {
                player: {
                  id: row.original.id,
                  first_name: row.original.first_name,
                  last_name: row.original.last_name,
                  country: row.original.country
                }
              })
            ])
          } else {
            const currentGroupingIndex = currentGrouping.indexOf(row.groupingColumnId!)
            const playerGroupingIndex = currentGrouping.indexOf("player")

            if (playerGroupingIndex === -1) {
              const value = cell.getValue<number>()

              return `${value} player${value !== 1 ? "s" : ""}`
            } else if (currentGroupingIndex < playerGroupingIndex) {
              const uniquePlayers = useArrayUnique(row.getLeafRows().map(r => r.getValue("player"))).value.length
              return `${uniquePlayers} player${uniquePlayers !== 1 ? "s" : ""}`
            }
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
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientSortHeader, {
            column: column as Column<unknown>,
            label: "Age"
          })
        ]),
      cell: ({ cell, row, table }) => {
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
