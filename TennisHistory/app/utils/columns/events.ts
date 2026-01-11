import {
  DevOnly,
  EditionAwardsUpdate,
  EditionEntriesUpdate,
  EditionSeedsUpdate,
  PlayerLink,
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  UBadge,
  UButton,
  UIcon
} from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper, type Column, type ColumnDef, type Table } from "@tanstack/vue-table"
import appConfig from "~/app.config"
import type { ConsolidatedRound } from "~/components/edition/awards/index.vue"

const awardColumnHelper = createColumnHelper<ConsolidatedRound>()

export const awardsColumns = (
  getRound: (round: RoundEnumType, type: MatchTypeEnumType, tour: keyof typeof tourEnum) => AwardType | undefined,
  refresh: () => void
): TableColumn<ConsolidatedRound>[] => {
  const tournamentStore = useTournamentStore()

  return [
    // Need the column group for proper alignment
    awardColumnHelper.group({
      id: "round-grandparent",
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
    awardColumnHelper.group({
      id: "singles",
      header: () =>
        h(UBadge, {
          color: "Singles",
          label: "Singles",
          class: "w-full"
        }),
      columns: [
        awardColumnHelper.group({
          id: "singles_pm",
          header: "Prize Money",
          columns: tournamentStore.tours.map(tour => ({
            id: `${tour}-singles-pm`,
            accessorKey: `singles.${tour}.pm`,
            header:
              tournamentStore.tours.length > 1
                ? () =>
                    h(UBadge, {
                      color: tour as keyof typeof appConfig.ui.colors,
                      label: tour,
                      class: "w-full"
                    })
                : undefined,
            cell: ({ cell, row }) => {
              const value = cell.getValue<number>()

              if (isDefined(value)) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EditionAwardsUpdate,
                        {
                          award: getRound(row.original.round as RoundEnumType, "Singles", tour),
                          refresh: () => {}
                        },
                        () => value.toLocaleString("en-GB", { style: "currency", currency: row.original.currency! })
                      ),
                    fallback: () => value.toLocaleString("en-GB", { style: "currency", currency: row.original.currency! })
                  }
                )
              } else {
                return cell.renderValue()
              }
            }
          }))
        }),
        awardColumnHelper.group({
          id: "singles_points",
          header: "Points",
          columns: tournamentStore.tours.map(tour => ({
            id: `${tour}-singles-points`,
            accessorKey: `singles.${tour}.points`,
            header:
              tournamentStore.tours.length > 1
                ? () =>
                    h(UBadge, {
                      color: tour as keyof typeof appConfig.ui.colors,
                      label: tour,
                      class: "w-full"
                    })
                : undefined,
            cell: ({ cell, row }) => {
              const value = cell.getValue<number>()

              if (isDefined(value)) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EditionAwardsUpdate,
                        {
                          award: getRound(row.original.round as RoundEnumType, "Singles", tour),
                          refresh: () => {}
                        },
                        () => value.toLocaleString()
                      ),
                    fallback: () => value.toLocaleString()
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
    awardColumnHelper.group({
      id: "doubles",
      header: () =>
        h(UBadge, {
          color: "Doubles",
          label: "Doubles",
          class: "w-full"
        }),
      columns: [
        awardColumnHelper.group({
          id: "doubles_pm",
          header: "Prize Money",
          columns: tournamentStore.tours.map(tour => ({
            id: `${tour}-doubles-pm`,
            accessorKey: `doubles.${tour}.pm`,
            header:
              tournamentStore.tours.length > 1
                ? () =>
                    h(UBadge, {
                      color: tour as keyof typeof appConfig.ui.colors,
                      label: tour,
                      class: "w-full"
                    })
                : undefined,
            cell: ({ cell, row }) => {
              const value = cell.getValue<number>()

              if (isDefined(value)) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EditionAwardsUpdate,
                        {
                          award: getRound(row.original.round as RoundEnumType, "Doubles", tour),
                          refresh: () => {}
                        },
                        () => value.toLocaleString("en-GB", { style: "currency", currency: row.original.currency! })
                      ),
                    fallback: () => value.toLocaleString("en-GB", { style: "currency", currency: row.original.currency! })
                  }
                )
              } else {
                return cell.renderValue()
              }
            }
          }))
        }),
        awardColumnHelper.group({
          id: "doubles_points",
          header: "Points",
          columns: tournamentStore.tours.map(tour => ({
            id: `${tour}-doubles-points`,
            accessorKey: `doubles.${tour}.points`,
            header:
              tournamentStore.tours.length > 1
                ? () =>
                    h(UBadge, {
                      color: tour as keyof typeof appConfig.ui.colors,
                      label: tour,
                      class: "w-full"
                    })
                : undefined,
            cell: ({ cell, row }) => {
              const value = cell.getValue<number>()

              if (isDefined(value)) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EditionAwardsUpdate,
                        {
                          award: getRound(row.original.round as RoundEnumType, "Doubles", tour),
                          refresh: () => {}
                        },
                        () => value.toLocaleString()
                      ),
                    fallback: () => value.toLocaleString()
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

interface ConsolidatedSeed {
  seed: number
  entries: SeedType[]
}

const seedColumnHelper = createColumnHelper<ConsolidatedSeed>()

export const seedColumns = (refresh: () => void): TableColumn<ConsolidatedSeed>[] => {
  const tournamentStore = useTournamentStore()

  return [
    seedColumnHelper.group({
      id: "seed-grandparent",
      columns: [
        {
          id: "seed-parent",
          columns: [
            {
              accessorKey: "seed",
              header: "Seed"
            }
          ]
        }
      ]
    }),
    seedColumnHelper.group({
      id: "singles",
      header: ({ column }) =>
        h(UBadge, {
          color: "Singles",
          label: "Singles",
          class: "w-full"
        }),
      columns: [
        {
          id: "singles_main",
          header: () =>
            h(UBadge, {
              color: "Main",
              label: "Main",
              class: "w-full"
            }),
          columns: tournamentStore.tours.flatMap(tour => [
            {
              id: `singles-main-${tour}-team`,
              accessorFn: row => {
                const entry = row.entries.find(e => e.type === "Singles" && e.tour === tour && e.seed === row.seed)

                return entry
              },
              header:
                tournamentStore.tours.length > 1
                  ? () =>
                      h(UBadge, {
                        color: tour as keyof typeof appConfig.ui.colors,
                        label: tour,
                        class: "w-full"
                      })
                  : undefined,
              cell: ({ cell }) => {
                const entry = cell.getValue<SeedType | undefined>()

                if (entry) {
                  return h(
                    DevOnly,
                    {},
                    {
                      default: () =>
                        h(
                          EditionSeedsUpdate,
                          {
                            seed: entry,
                            refresh
                          },
                          () =>
                            h(
                              "div",
                              { class: "flex flex-col " + (entry.withdrew ? "line-through" : "") },
                              entry.team.map(player =>
                                h("div", { class: "flex items-center gap-2" }, [
                                  h(UIcon, { name: getFlagCode(player.country as CountryType) }),
                                  h("span", {}, `${player.first_name} ${player.last_name}`)
                                ])
                              )
                            )
                        ),
                      fallback: () =>
                        entry.team.map(player =>
                          h(PlayerLink, {
                            key: player.id,
                            player,
                            strikethrough: entry.withdrew
                          })
                        )
                    }
                  )
                }
              }
            },
            {
              id: `singles-main-${tour}-rank`,
              accessorFn: row => {
                const entry = row.entries.find(e => e.type === "Singles" && e.tour === tour && e.seed === row.seed)

                return entry
              },
              header: "Rank",
              meta: { class: { td: "text-center" } },
              cell: ({ cell }) => {
                const entry = cell.getValue<SeedType | undefined>()

                if (entry) {
                  return h(
                    DevOnly,
                    {},
                    {
                      default: () =>
                        h(
                          EditionSeedsUpdate,
                          {
                            seed: entry,
                            refresh
                          },
                          () => h("div", { class: entry.withdrew ? "line-through" : "" }, entry.rank?.toLocaleString())
                        ),
                      fallback: () => entry.rank?.toLocaleString()
                    }
                  )
                }
              }
            }
          ])
        },
        {
          id: "singles_qualifying",
          header: () =>
            h(UBadge, {
              color: "Qualifying",
              label: "Qualifying",
              class: "w-full"
            }),
          columns: tournamentStore.tours.flatMap(tour => [
            {
              id: `singles-qualifying-${tour}-team`,
              accessorFn: row => {
                const entry = row.entries.find(e => e.type === "Singles" && e.tour === tour && e.q_seed === row.seed)

                return entry
              },
              header:
                tournamentStore.tours.length > 1
                  ? () =>
                      h(UBadge, {
                        color: tour as keyof typeof appConfig.ui.colors,
                        label: tour,
                        class: "w-full"
                      })
                  : undefined,
              cell: ({ cell }) => {
                const entry = cell.getValue<SeedType | undefined>()

                if (entry) {
                  return h(
                    DevOnly,
                    {},
                    {
                      default: () =>
                        h(
                          EditionSeedsUpdate,
                          {
                            seed: entry,
                            refresh
                          },
                          () =>
                            h(
                              "div",
                              { class: "flex flex-col " + (entry.withdrew ? "line-through" : "") },
                              entry.team.map(player =>
                                h("div", { class: "flex items-center gap-2" }, [
                                  h(UIcon, { name: getFlagCode(player.country as CountryType) }),
                                  h("span", {}, `${player.first_name} ${player.last_name}`)
                                ])
                              )
                            )
                        ),
                      fallback: () =>
                        entry.team.map(player =>
                          h(PlayerLink, {
                            key: player.id,
                            player,
                            strikethrough: entry.withdrew
                          })
                        )
                    }
                  )
                }
              }
            },
            {
              id: `singles-qualifying-${tour}-rank`,
              accessorFn: row => {
                const entry = row.entries.find(e => e.type === "Singles" && e.tour === tour && e.q_seed === row.seed)

                return entry
              },
              header: "Rank",
              meta: { class: { td: "text-center" } },
              cell: ({ cell }) => {
                const entry = cell.getValue<SeedType | undefined>()

                if (entry) {
                  return h(
                    DevOnly,
                    {},
                    {
                      default: () =>
                        h(
                          EditionSeedsUpdate,
                          {
                            seed: entry,
                            refresh
                          },
                          () => h("div", { class: entry.withdrew ? "line-through" : "" }, entry.rank?.toLocaleString())
                        ),
                      fallback: () => entry.rank?.toLocaleString()
                    }
                  )
                }
              }
            }
          ])
        }
      ]
    }),
    seedColumnHelper.group({
      id: "doubles",
      header: () =>
        h(UBadge, {
          color: "Doubles",
          label: "Doubles",
          class: "w-full"
        }),
      columns: [
        {
          id: "doubles_main",
          header: () =>
            h(UBadge, {
              color: "Main",
              label: "Main",
              class: "w-full"
            }),
          columns: tournamentStore.tours.flatMap(tour => [
            {
              id: `doubles-main-${tour}-team`,
              accessorFn: row => {
                const entry = row.entries.find(e => e.type === "Doubles" && e.tour === tour && e.seed === row.seed)

                return entry
              },
              header:
                tournamentStore.tours.length > 1
                  ? () =>
                      h(UBadge, {
                        color: tour as keyof typeof appConfig.ui.colors,
                        label: tour,
                        class: "w-full"
                      })
                  : undefined,
              cell: ({ cell }) => {
                const entry = cell.getValue<SeedType | undefined>()

                if (entry) {
                  return h(
                    DevOnly,
                    {},
                    {
                      default: () =>
                        h(
                          EditionSeedsUpdate,
                          {
                            seed: entry,
                            refresh
                          },
                          () =>
                            h(
                              "div",
                              { class: "flex flex-col " + (entry.withdrew ? "line-through" : "") },
                              entry.team.map(player =>
                                h("div", { class: "flex items-center gap-2" }, [
                                  h(UIcon, { name: getFlagCode(player.country as CountryType) }),
                                  h("span", {}, `${player.first_name} ${player.last_name}`)
                                ])
                              )
                            )
                        ),
                      fallback: () =>
                        entry.team.map(player =>
                          h(PlayerLink, {
                            key: player.id,
                            player,
                            strikethrough: entry.withdrew
                          })
                        )
                    }
                  )
                }
              }
            },
            {
              id: `doubles-main-${tour}-rank`,
              accessorFn: row => {
                const entry = row.entries.find(e => e.type === "Doubles" && e.tour === tour && e.seed === row.seed)

                return entry
              },
              header: "Rank",
              meta: { class: { td: "text-center" } },
              cell: ({ cell }) => {
                const entry = cell.getValue<SeedType | undefined>()

                if (entry) {
                  return h(
                    DevOnly,
                    {},
                    {
                      default: () =>
                        h(
                          EditionSeedsUpdate,
                          {
                            seed: entry,
                            refresh
                          },
                          () => h("div", { class: entry.withdrew ? "line-through" : "" }, entry.rank?.toLocaleString())
                        ),
                      fallback: () => entry.rank?.toLocaleString()
                    }
                  )
                }
              }
            }
          ])
        },
        {
          id: "doubles_qualifying",
          header: () =>
            h(UBadge, {
              color: "Qualifying",
              label: "Qualifying",
              class: "w-full"
            }),
          columns: tournamentStore.tours.flatMap(tour => [
            {
              id: `doubles-qualifying-${tour}-team`,
              accessorFn: row => {
                const entry = row.entries.find(e => e.type === "Doubles" && e.tour === tour && e.q_seed === row.seed)

                return entry
              },
              header:
                tournamentStore.tours.length > 1
                  ? () =>
                      h(UBadge, {
                        color: tour as keyof typeof appConfig.ui.colors,
                        label: tour,
                        class: "w-full"
                      })
                  : undefined,
              cell: ({ cell }) => {
                const entry = cell.getValue<SeedType | undefined>()

                if (entry) {
                  return h(
                    DevOnly,
                    {},
                    {
                      default: () =>
                        h(
                          EditionSeedsUpdate,
                          {
                            seed: entry,
                            refresh
                          },
                          () =>
                            h(
                              "div",
                              { class: "flex flex-col " + (entry.withdrew ? "line-through" : "") },
                              entry.team.map(player =>
                                h("div", { class: "flex items-center gap-2" }, [
                                  h(UIcon, { name: getFlagCode(player.country as CountryType) }),
                                  h("span", {}, `${player.first_name} ${player.last_name}`)
                                ])
                              )
                            )
                        ),
                      fallback: () =>
                        entry.team.map(player =>
                          h(PlayerLink, {
                            key: player.id,
                            player,
                            strikethrough: entry.withdrew
                          })
                        )
                    }
                  )
                }
              }
            },
            {
              id: `doubles-qualifying-${tour}-rank`,
              accessorFn: row => {
                const entry = row.entries.find(e => e.type === "Doubles" && e.tour === tour && e.q_seed === row.seed)

                return entry
              },
              header: "Rank",
              meta: { class: { td: "text-center" } },
              cell: ({ cell }) => {
                const entry = cell.getValue<SeedType | undefined>()

                if (entry) {
                  return h(
                    DevOnly,
                    {},
                    {
                      default: () =>
                        h(
                          EditionSeedsUpdate,
                          {
                            seed: entry,
                            refresh
                          },
                          () => h("div", { class: entry.withdrew ? "line-through" : "" }, entry.rank?.toLocaleString())
                        ),
                      fallback: () => entry.rank?.toLocaleString()
                    }
                  )
                }
              }
            }
          ])
        }
      ]
    })
  ]
}

const playerEntryColumnHelper = createColumnHelper<PlayerEntryType>()

export const playerEntryColumns = (refresh: () => void): TableColumn<PlayerEntryType>[] => {
  const tournamentStore = useTournamentStore()

  return [
    {
      id: "player",
      accessorFn: row => `${row.last_name}, ${row.first_name}`,
      aggregationFn: "uniqueCount",
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
      cell: ({ row }) => {
        if (!row.getIsGrouped()) {
          return h(PlayerLink, { player: row.original })
        }
      }
    },
    {
      accessorKey: "tour",
      meta: { class: { td: "text-center py-1" } },
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientNameFilterHeader, {
            column: column as Column<unknown>,
            label: "Tour",
            icon: ICONS.tour
          })
        ]),
      cell: ({ row, table }) => {
        if (row.getIsGrouped()) {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            h(UBadge, {
              label: row.original.tour,
              color: row.original.tour as keyof typeof appConfig.ui.colors
            })
          ])
        } else if (!table.getState().grouping.includes("tour")) {
          return h(UBadge, {
            label: row.original.tour,
            color: row.original.tour as keyof typeof appConfig.ui.colors
          })
        }
      }
    },
    playerEntryColumnHelper.group({
      id: "singles",
      header: () => (COUNTRY_DRAWS.includes(tournamentStore.id) ? "" : h(UBadge, { label: "Singles", color: "Singles", class: "w-full" })),
      columns: [
        {
          accessorKey: "singles.draws",
          filterFn: (row, columnId, filterValue) => {
            const draws = row.getValue<string[]>(columnId)

            if (!filterValue) {
              return true
            }

            if (draws) {
              return draws.some(draw => draw.includes(filterValue))
            }

            return false
          },
          header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Draws" }),
          cell: ({ row }) => {
            if (!row.getIsGrouped() && row.original.singles?.draws) {
              return h(
                "div",
                { class: "flex items-center gap-2 py-1" },
                row.original.singles.draws.map(draw =>
                  h(UBadge, {
                    label: draw,
                    color: draw
                  })
                )
              )
            }
          }
        },
        {
          id: "singles_seed",
          accessorFn: row => row.singles?.seed ?? (row.singles?.q_seed ? `Q-${row.singles.q_seed}` : undefined),
          sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
            // Sort numbers first, then strings, then undefined
            const a = rowA.getValue(columnId)
            const b = rowB.getValue(columnId)

            if (a === undefined) return 1
            if (b === undefined) return -1

            if (typeof a === "string" && typeof b === "number") return 1
            if (typeof a === "number" && typeof b === "string") return -1

            return (a as number) - (b as number)
          },
          meta: { class: { td: "text-center" } },
          header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Seed" })
        },
        {
          id: "singles_status",
          accessorFn: row => {
            const statuses: string[] = []

            if (row.singles?.status) {
              statuses.push(statusEnum[row.singles.status])
            }

            if (row.singles?.q_status) {
              statuses.push(`Q-${statusEnum[row.singles.q_status]}`)
            }

            return statuses
          },
          filterFn: (row, columnId, filterValue) => {
            const statuses = row.getValue<string[]>(columnId)

            if (!filterValue) {
              return true
            }

            if (statuses) {
              return statuses.some(status => status.includes(filterValue))
            }

            return false
          },
          header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Status" }),
          cell: ({ cell, row }) => {
            if (!row.getIsGrouped()) {
              return cell.getValue<string[]>().join(" / ")
            }
          }
        },
        {
          accessorKey: "singles.rank",
          aggregationFn: "mean",
          sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
            // Sort defined ranks first, then zeros, then undefined
            const a = rowA.getValue(columnId)
            const b = rowB.getValue(columnId)

            if (a === undefined) return 1
            if (b === undefined) return -1

            if (a === 0) return 1
            if (b === 0) return -1

            return (a as number) - (b as number)
          },
          meta: { class: { td: "text-center" } },
          header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Rank" }),
          cell: ({ row, cell }) => {
            if (row.getIsGrouped()) {
              return Math.round(cell.getValue<number>())
            } else {
              if (row.original.singles?.draws?.length || row.original.singles?.withdrew) {
                const { doubles, singles, ...rest } = row.original
                return h(
                  EditionEntriesUpdate,
                  {
                    entry: singles,
                    player: rest,
                    type: "Singles",
                    refresh
                  },
                  () => cell.renderValue()
                )
              }
            }
          }
        }
      ]
    }),
    playerEntryColumnHelper.group({
      id: "doubles",
      header: () => (COUNTRY_DRAWS.includes(tournamentStore.id) ? "" : h(UBadge, { label: "Doubles", color: "Doubles", class: "w-full" })),
      columns: [
        {
          accessorKey: "doubles.draws",
          filterFn: (row, columnId, filterValue) => {
            const draws = row.getValue<string[]>(columnId)

            if (!filterValue) {
              return true
            }

            if (draws) {
              return draws.some(draw => draw.includes(filterValue))
            }

            return false
          },
          header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Draws" }),
          cell: ({ row }) => {
            if (!row.getIsGrouped() && row.original.doubles?.draws) {
              return h(
                "div",
                { class: "flex items-center gap-2 py-1" },
                row.original.doubles.draws.map(draw =>
                  h(UBadge, {
                    label: draw,
                    color: draw
                  })
                )
              )
            }
          }
        },
        {
          id: "doubles_seed",
          accessorFn: row => row.doubles?.seed ?? (row.doubles?.q_seed ? `Q-${row.doubles.q_seed}` : undefined),
          sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
            // Sort numbers first, then strings, then undefined
            const a = rowA.getValue(columnId)
            const b = rowB.getValue(columnId)

            if (a === undefined) return 1
            if (b === undefined) return -1

            if (typeof a === "string" && typeof b === "number") return 1
            if (typeof a === "number" && typeof b === "string") return -1

            return (a as number) - (b as number)
          },
          meta: { class: { td: "text-center" } },
          header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Seed" })
        },
        {
          id: "doubles_status",
          accessorFn: row => {
            const statuses: string[] = []

            if (row.doubles?.status) {
              statuses.push(statusEnum[row.doubles.status])
            }

            if (row.doubles?.q_status) {
              statuses.push(`Q-${statusEnum[row.doubles.q_status]}`)
            }

            return statuses
          },
          filterFn: (row, columnId, filterValue) => {
            const statuses = row.getValue<string[]>(columnId)

            if (!filterValue) {
              return true
            }

            if (statuses) {
              return statuses.some(status => status.includes(filterValue))
            }

            return false
          },
          header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Status" }),
          cell: ({ cell, row }) => {
            if (!row.getIsGrouped()) {
              return cell.getValue<string[]>().join(" / ")
            }
          }
        },
        {
          accessorKey: "doubles.rank",
          aggregationFn: "mean",
          sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
            // Sort defined ranks first, then zeros, then undefined
            const a = rowA.getValue(columnId)
            const b = rowB.getValue(columnId)

            if (a === undefined) return 1
            if (b === undefined) return -1

            if (a === 0) return 1
            if (b === 0) return -1

            return (a as number) - (b as number)
          },
          meta: { class: { td: "text-center" } },
          header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Rank" }),
          cell: ({ row, cell }) => {
            if (row.getIsGrouped()) {
              return Math.round(cell.getValue<number>())
            } else {
              if (row.original.doubles?.draws?.length || row.original.doubles?.withdrew) {
                const { doubles, singles, ...rest } = row.original
                return h(
                  EditionEntriesUpdate,
                  {
                    entry: doubles,
                    player: rest,
                    type: "Doubles",
                    refresh
                  },
                  () => cell.renderValue()
                )
              }
            }
          }
        }
      ]
    })
  ]
}

export const teamEntryColumns: TableColumn<TeamEntryType>[] = [
  {
    id: "team",
    accessorFn: row => row.team.map(player => `${player.last_name}, ${player.first_name}`).join(" / "),
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
        return row.original.team.map(player =>
          h(PlayerLink, {
            key: player.id,
            player,
            strikethrough: row.original.withdrew
          })
        )
      }
    }
  },
  {
    accessorKey: "tour",
    meta: { class: { td: "text-center py-1" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientNameFilterHeader, {
          column: column as Column<unknown>,
          label: "Tour",
          icon: ICONS.tour
        })
      ]),
    cell: ({ row, table }) => {
      const currentGrouping = table.getState().grouping

      if (row.getIsGrouped() && row.groupingColumnId === "tour") {
        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          h(UBadge, {
            label: row.original.tour,
            color: row.original.tour as keyof typeof appConfig.ui.colors
          })
        ])
      } else if (!currentGrouping.includes("tour")) {
        return h(UBadge, {
          label: row.original.tour,
          color: row.original.tour as keyof typeof appConfig.ui.colors
        })
      }
    }
  },
  {
    accessorKey: "type",
    meta: { class: { td: "text-center py-1" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientNameFilterHeader, {
          column: column as Column<unknown>,
          label: "S/D",
          icon: ICONS.people
        })
      ]),
    cell: ({ row, table }) => {
      const currentGrouping = table.getState().grouping

      if (row.getIsGrouped() && row.groupingColumnId === "type") {
        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          h(UBadge, {
            label: row.original.type,
            color: row.original.type as keyof typeof appConfig.ui.colors
          })
        ])
      } else if (!currentGrouping.includes("type")) {
        return h(UBadge, {
          label: row.original.type,
          color: row.original.type as keyof typeof appConfig.ui.colors
        })
      }
    }
  },
  {
    accessorKey: "draws",
    filterFn: (row, columnId, filterValue) => {
      const draws = row.getValue<string[]>(columnId)

      if (!filterValue) {
        return true
      }

      if (draws) {
        return draws.some(draw => draw.includes(filterValue))
      }

      return false
    },
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Draws" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(
          "div",
          { class: "flex items-center gap-2 py-2" },
          row.original.draws.map(draw =>
            h(UBadge, {
              label: draw,
              color: draw
            })
          )
        )
      }
    }
  },
  {
    id: "seed",
    accessorFn: row => row.seed ?? (row.q_seed ? `Q-${row.q_seed}` : undefined),
    sortingFn: (rowA: TableRow<TeamEntryType>, rowB: TableRow<TeamEntryType>, columnId: string) => {
      // Sort numbers first, then strings, then undefined
      const a = rowA.getValue(columnId)
      const b = rowB.getValue(columnId)

      if (a === undefined) return 1
      if (b === undefined) return -1

      if (typeof a === "string" && typeof b === "number") return 1
      if (typeof a === "number" && typeof b === "string") return -1

      return (a as number) - (b as number)
    },
    meta: { class: { td: "text-center" } },
    header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Seed" }),
    cell: ({ cell, row }) => {
      if (!row.getIsGrouped()) {
        return cell.getValue()
      }
    }
  },
  {
    id: "status",
    accessorFn: row => {
      const statuses: string[] = []

      if (row.status) {
        statuses.push(statusEnum[row.status])
      }

      if (row.q_status) {
        statuses.push(`Q-${statusEnum[row.q_status]}`)
      }

      return statuses
    },
    filterFn: (row, columnId, filterValue) => {
      const statuses = row.getValue<string[]>(columnId)

      if (!filterValue) {
        return true
      }

      if (statuses) {
        return statuses.some(status => status.includes(filterValue))
      }

      return false
    },
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Status" }),
    cell: ({ cell, row }) => {
      if (!row.getIsGrouped()) {
        return cell.getValue<string[]>().join(" / ")
      }
    }
  },
  {
    accessorKey: "rank",
    aggregationFn: "mean",
    sortingFn: (rowA: TableRow<TeamEntryType>, rowB: TableRow<TeamEntryType>, columnId: string) => {
      // Sort defined ranks first, then zeros, then undefined
      const a = rowA.getValue(columnId)
      const b = rowB.getValue(columnId)

      if (a === undefined) return 1
      if (b === undefined) return -1

      if (a === 0) return 1
      if (b === 0) return -1

      return (a as number) - (b as number)
    },
    meta: { class: { td: "text-center" } },
    header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Rank" }),
    cell: ({ row, cell }) => {
      if (row.getIsGrouped()) {
        return Math.round(cell.getValue<number>())
      } else {
        const { team } = row.original

        if (team.length === 2) {
          return h(
            "div",
            {
              class: "flex items-center justify-center gap-2"
            },
            [
              h(
                "div",
                {},
                team.map(player =>
                  h(
                    "div",
                    {
                      key: player.id
                    },
                    player.rank
                  )
                )
              ),
              h("div", {}, `[${cell.getValue()}]`)
            ]
          )
        } else {
          return cell.getValue()
        }
      }
    }
  }
]
