import { DevOnly, EditionsSeedsUpdate, PlayersLink, UBadge } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper, type CellContext } from "@tanstack/vue-table"
import appConfig from "~/app.config"

type ConsolidatedSeed = {
  seed: number
  singles: {
    Main: Record<keyof typeof tourEnum, { team: PersonType[]; rank?: number; withdrew?: boolean }>
    Qualifying: Record<keyof typeof tourEnum, { team: PersonType[]; rank?: number; withdrew?: boolean }>
  }
  doubles: {
    Main: Record<keyof typeof tourEnum, { team: PersonType[]; rank?: number; withdrew?: boolean }>
    Qualifying: Record<keyof typeof tourEnum, { team: PersonType[]; rank?: number; withdrew?: boolean }>
  }
}

const columnHelper = createColumnHelper<ConsolidatedSeed>()

const columns = (
  tours: (keyof typeof tourEnum)[],
  refresh: () => void,
  getSeed: (seed: number, tour: keyof typeof tourEnum, draw: DrawEnumType, type: MatchTypeEnumType) => SeedType | undefined
): TableColumn<ConsolidatedSeed>[] => {
  return [
    columnHelper.group({
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
    columnHelper.group({
      id: "singles",
      header: () =>
        h(UBadge, {
          color: "Singles",
          label: "Singles",
          class: "w-full justify-center"
        }),
      columns: [
        {
          id: "singles-main",
          header: () =>
            h(UBadge, {
              color: "Main",
              label: "Main",
              class: "w-full justify-center"
            }),
          columns: tours
            .map(tour => [
              {
                id: `${tour}-singles-main-team`,
                header:
                  tours.length > 1
                    ? () =>
                        h(UBadge, {
                          color: tour as keyof typeof appConfig.ui.colors,
                          label: tour,
                          class: "w-full justify-center"
                        })
                    : "Player",
                cell: ({ row }: { row: TableRow<ConsolidatedSeed> }) => {
                  if (row.original.singles.Main[tour].team.length) {
                    return h(
                      DevOnly,
                      {},
                      {
                        default: () =>
                          h(
                            EditionsSeedsUpdate,
                            {
                              refresh,
                              seed: getSeed(row.original.seed, tour, "Main", "Singles")
                            },
                            () => row.original.singles.Main[tour].team.map(player => `${player.first_name} ${player.last_name}`).join(" / ")
                          ),
                        fallback: () =>
                          row.original.singles.Main[tour].team.map(player =>
                            h(PlayersLink, {
                              key: player.id,
                              player,
                              strikethrough: row.original.singles.Main[tour].withdrew
                            })
                          )
                      }
                    )
                  } else {
                    return "—"
                  }
                }
              },
              {
                id: `${tour}-singles-main-rank`,
                header: "Rank",
                accessorKey: `singles.Main.${tour}.rank`,
                cell: ({ row }: { row: TableRow<ConsolidatedSeed> }) => {
                  const { seed } = row.original
                  const rank = row.original.singles.Main[tour].rank

                  if (isDefined(rank)) {
                    return h(
                      DevOnly,
                      {},
                      {
                        default: () =>
                          h(
                            EditionsSeedsUpdate,
                            {
                              refresh,
                              seed: getSeed(seed, tour, "Main", "Singles")
                            },
                            () => rank.toLocaleString()
                          ),
                        fallback: () => rank.toLocaleString()
                      }
                    )
                  } else {
                    return "—"
                  }
                }
              }
            ])
            .flat()
        },
        {
          id: "singles-qualifying",
          header: () =>
            h(UBadge, {
              color: "Qualifying",
              label: "Qualifying",
              class: "w-full justify-center"
            }),
          columns: tours
            .map(tour => [
              {
                id: `${tour}-singles-main-team`,
                header:
                  tours.length > 1
                    ? () =>
                        h(UBadge, {
                          color: tour as keyof typeof appConfig.ui.colors,
                          label: tour,
                          class: "w-full justify-center"
                        })
                    : "Player",
                cell: ({ row }: { row: TableRow<ConsolidatedSeed> }) => {
                  if (row.original.singles.Qualifying[tour].team.length) {
                    return h(
                      DevOnly,
                      {},
                      {
                        default: () =>
                          h(
                            EditionsSeedsUpdate,
                            {
                              refresh,
                              seed: getSeed(row.original.seed, tour, "Qualifying", "Singles")
                            },
                            () => row.original.singles.Qualifying[tour].team.map(player => `${player.first_name} ${player.last_name}`).join(" / ")
                          ),
                        fallback: () =>
                          row.original.singles.Qualifying[tour].team.map(player =>
                            h(PlayersLink, {
                              key: player.id,
                              player,
                              strikethrough: row.original.singles.Qualifying[tour].withdrew
                            })
                          )
                      }
                    )
                  } else {
                    return "—"
                  }
                }
              },
              {
                id: `${tour}-singles-qualifying-rank`,
                header: "Rank",
                accessorKey: `singles.Qualifying.${tour}.rank`,
                cell: ({ row }: { row: TableRow<ConsolidatedSeed> }) => {
                  const { seed } = row.original
                  const rank = row.original.singles.Qualifying[tour].rank

                  if (isDefined(rank)) {
                    return h(
                      DevOnly,
                      {},
                      {
                        default: () =>
                          h(
                            EditionsSeedsUpdate,
                            {
                              refresh,
                              seed: getSeed(seed, tour, "Qualifying", "Singles")
                            },
                            () => rank.toLocaleString()
                          ),
                        fallback: () => rank.toLocaleString()
                      }
                    )
                  } else {
                    return "—"
                  }
                }
              }
            ])
            .flat()
        }
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
        {
          id: "doubles-main",
          header: () =>
            h(UBadge, {
              color: "Main",
              label: "Main",
              class: "w-full justify-center"
            }),
          columns: tours
            .map(tour => [
              {
                id: `${tour}-doubles-main-team`,
                header:
                  tours.length > 1
                    ? () =>
                        h(UBadge, {
                          color: tour as keyof typeof appConfig.ui.colors,
                          label: tour,
                          class: "w-full justify-center"
                        })
                    : "Team",
                cell: ({ row }: { row: TableRow<ConsolidatedSeed> }) => {
                  if (row.original.doubles.Main[tour].team.length) {
                    return h(
                      DevOnly,
                      {},
                      {
                        default: () =>
                          h(
                            EditionsSeedsUpdate,
                            {
                              refresh,
                              seed: getSeed(row.original.seed, tour, "Main", "Doubles")
                            },
                            () => row.original.doubles.Main[tour].team.map(player => `${player.first_name} ${player.last_name}`).join(" / ")
                          ),
                        fallback: () =>
                          row.original.doubles.Main[tour].team.map(player =>
                            h(PlayersLink, {
                              key: player.id,
                              player,
                              strikethrough: row.original.doubles.Main[tour].withdrew
                            })
                          )
                      }
                    )
                  } else {
                    return "—"
                  }
                }
              },
              {
                id: `${tour}-doubles-main-rank`,
                header: "Rank",
                accessorKey: `doubles.Main.${tour}.rank`,
                cell: ({ row }: { row: TableRow<ConsolidatedSeed> }) => {
                  const { seed } = row.original
                  const rank = row.original.doubles.Main[tour].rank

                  if (isDefined(rank)) {
                    return h(
                      DevOnly,
                      {},
                      {
                        default: () =>
                          h(
                            EditionsSeedsUpdate,
                            {
                              refresh,
                              seed: getSeed(seed, tour, "Main", "Doubles")
                            },
                            () => rank.toLocaleString()
                          ),
                        fallback: () => rank.toLocaleString()
                      }
                    )
                  } else {
                    return "—"
                  }
                }
              }
            ])
            .flat()
        },
        {
          id: "doubles-qualifying",
          header: () =>
            h(UBadge, {
              color: "Qualifying",
              label: "Qualifying",
              class: "w-full justify-center"
            }),
          columns: tours
            .map(tour => [
              {
                id: `${tour}-doubles-main-team`,
                header:
                  tours.length > 1
                    ? () =>
                        h(UBadge, {
                          color: tour as keyof typeof appConfig.ui.colors,
                          label: tour,
                          class: "w-full justify-center"
                        })
                    : "Player",
                cell: ({ row }: { row: TableRow<ConsolidatedSeed> }) => {
                  if (row.original.doubles.Qualifying[tour].team.length) {
                    return h(
                      DevOnly,
                      {},
                      {
                        default: () =>
                          h(
                            EditionsSeedsUpdate,
                            {
                              refresh,
                              seed: getSeed(row.original.seed, tour, "Qualifying", "Doubles")
                            },
                            () => row.original.doubles.Qualifying[tour].team.map(player => `${player.first_name} ${player.last_name}`).join(" / ")
                          ),
                        fallback: () =>
                          row.original.doubles.Qualifying[tour].team.map(player =>
                            h(PlayersLink, {
                              key: player.id,
                              player,
                              strikethrough: row.original.doubles.Qualifying[tour].withdrew
                            })
                          )
                      }
                    )
                  } else {
                    return "—"
                  }
                }
              },
              {
                id: `${tour}-doubles-qualifying-rank`,
                header: "Rank",
                accessorKey: `doubles.Qualifying.${tour}.rank`,
                cell: ({ row }: { row: TableRow<ConsolidatedSeed> }) => {
                  const { seed } = row.original
                  const rank = row.original.doubles.Qualifying[tour].rank

                  if (isDefined(rank)) {
                    return h(
                      DevOnly,
                      {},
                      {
                        default: () =>
                          h(
                            EditionsSeedsUpdate,
                            {
                              refresh,
                              seed: getSeed(seed, tour, "Qualifying", "Doubles")
                            },
                            () => rank.toLocaleString()
                          ),
                        fallback: () => rank.toLocaleString()
                      }
                    )
                  } else {
                    return "—"
                  }
                }
              }
            ])
            .flat()
        }
      ]
    })
  ]
}

export default columns
