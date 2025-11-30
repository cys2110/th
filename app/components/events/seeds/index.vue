<script setup lang="ts">
import { DevOnly, EventsSeedsUpdate, PlayersLink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { edId, tour }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()

const {
  data: seeds,
  status,
  refresh
} = await useFetch("/api/events/seeds", {
  query: { edId, tour },
  default: () => []
})

const consolidatedSeeds = computed(() => {
  const uniqueSeeds = useSorted(useArrayUnique(seeds.value.map(s => s.seed))).value

  return uniqueSeeds.map(seedNumber => {
    const mainSingles = seeds.value.find(s => s.seed === seedNumber && s.type === "Singles" && s.draw === "Main")
    const qualSingles = seeds.value.find(s => s.seed === seedNumber && s.type === "Singles" && s.draw === "Qualifying")
    const mainDoubles = seeds.value.find(s => s.seed === seedNumber && s.type === "Doubles" && s.draw === "Main")
    const qualDoubles = seeds.value.find(s => s.seed === seedNumber && s.type === "Doubles" && s.draw === "Qualifying")

    return {
      seed: seedNumber,
      mainSinglesTeam: {
        withdrew: mainSingles?.withdrew ?? false,
        players: mainSingles?.team ?? []
      },
      mainSinglesRank: mainSingles?.rank ?? null,
      qualSinglesTeam: {
        withdrew: qualSingles?.withdrew ?? false,
        players: qualSingles?.team ?? []
      },
      qualSinglesRank: qualSingles?.rank ?? null,
      mainDoublesTeam: {
        withdrew: mainDoubles?.withdrew ?? false,
        players: mainDoubles?.team ?? []
      },
      mainDoublesRank: mainDoubles?.rank ?? null,
      qualDoublesTeam: {
        withdrew: qualDoubles?.withdrew ?? false,
        players: qualDoubles?.team ?? []
      },
      qualDoublesRank: qualDoubles?.rank ?? null
    }
  })
})

type ConsolidatedSeed = (typeof consolidatedSeeds.value)[number]

const columnHelper = createColumnHelper<ConsolidatedSeed>()

const columns: TableColumn<ConsolidatedSeed>[] = [
  { accessorKey: "seed", header: "Seed" },
  columnHelper.group({
    header: "Singles",
    columns: [
      columnHelper.group({
        header: "Main",
        columns: [
          {
            accessorKey: "mainSinglesTeam",
            header: "Player",
            cell: ({ row }) => {
              const team = row.original.mainSinglesTeam.players

              if (team.length) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(EventsSeedsUpdate, { refresh, seed: getSeed(row.original.seed, "Singles", "Main") }, () =>
                        team.map(player => {
                          return h(PlayersLink, {
                            key: player.id,
                            player,
                            strikethrough: row.original.mainSinglesTeam.withdrew
                          })
                        })
                      ),
                    fallback: () =>
                      team.map(player =>
                        h(PlayersLink, {
                          key: player.id,
                          player
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
            accessorKey: "mainSinglesRank",
            header: "Rank",
            cell: ({ row }) => {
              const rank = row.original.mainSinglesRank

              if (isDefined(rank)) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EventsSeedsUpdate,
                        { refresh, seed: getSeed(row.original.seed, "Singles", "Main"), strikethrough: row.original.mainSinglesTeam.withdrew },
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
        ]
      }),
      columnHelper.group({
        header: "Qualifying",
        columns: [
          {
            accessorKey: "qualSinglesTeam",
            header: "Player",
            cell: ({ row }) => {
              const team = row.original.qualSinglesTeam.players

              if (team.length) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EventsSeedsUpdate,
                        { refresh, seed: getSeed(row.original.seed, "Singles", "Qualifying"), strikethrough: row.original.qualSinglesTeam.withdrew },
                        () =>
                          team.map(player =>
                            h(PlayersLink, {
                              key: player.id,
                              player
                            })
                          )
                      ),
                    fallback: () =>
                      team.map(player =>
                        h(PlayersLink, {
                          key: player.id,
                          player
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
            accessorKey: "qualSinglesRank",
            header: "Rank",
            cell: ({ row }) => {
              const rank = row.original.qualSinglesRank

              if (isDefined(rank)) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EventsSeedsUpdate,
                        { refresh, seed: getSeed(row.original.seed, "Singles", "Qualifying"), strikethrough: row.original.qualSinglesTeam.withdrew },
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
        ]
      })
    ]
  }),
  columnHelper.group({
    header: "Doubles",
    columns: [
      columnHelper.group({
        header: "Main",
        columns: [
          {
            accessorKey: "mainDoublesTeam",
            header: "Player",
            cell: ({ row }) => {
              const team = row.original.mainDoublesTeam.players

              if (team.length) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EventsSeedsUpdate,
                        { refresh, seed: getSeed(row.original.seed, "Doubles", "Main"), strikethrough: row.original.mainDoublesTeam.withdrew },
                        () =>
                          h(
                            "div",
                            { class: "flex flex-col items-center" },
                            team.map(player =>
                              h(PlayersLink, {
                                key: player.id,
                                player
                              })
                            )
                          )
                      ),
                    fallback: () =>
                      team.map(player =>
                        h(PlayersLink, {
                          key: player.id,
                          player
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
            accessorKey: "mainDoublesRank",
            header: "Rank",
            cell: ({ row }) => {
              const rank = row.original.mainDoublesRank

              if (isDefined(rank)) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EventsSeedsUpdate,
                        { refresh, seed: getSeed(row.original.seed, "Doubles", "Main"), strikethrough: row.original.mainDoublesTeam.withdrew },
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
        ]
      }),
      columnHelper.group({
        header: "Qualifying",
        columns: [
          {
            accessorKey: "qualDoublesTeam",
            header: "Player",
            cell: ({ row }) => {
              const team = row.original.qualDoublesTeam.players

              if (team.length) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EventsSeedsUpdate,
                        { refresh, seed: getSeed(row.original.seed, "Doubles", "Qualifying"), strikethrough: row.original.qualDoublesTeam.withdrew },
                        () =>
                          h(
                            "div",
                            { class: "flex flex-col items-center" },
                            team.map(player =>
                              h(PlayersLink, {
                                key: player.id,
                                player
                              })
                            )
                          )
                      ),
                    fallback: () =>
                      team.map(player =>
                        h(PlayersLink, {
                          key: player.id,
                          player
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
            accessorKey: "qualDoublesRank",
            header: "Rank",
            cell: ({ row }) => {
              const rank = row.original.qualDoublesRank

              if (isDefined(rank)) {
                return h(
                  DevOnly,
                  {},
                  {
                    default: () =>
                      h(
                        EventsSeedsUpdate,
                        { refresh, seed: getSeed(row.original.seed, "Doubles", "Qualifying"), strikethrough: row.original.qualDoublesTeam.withdrew },
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
        ]
      })
    ]
  })
]

const columnPinning = ref({
  left: ["seed"],
  right: []
})

const getSeed = (seed: number, type: "Singles" | "Doubles", draw: "Main" | "Qualifying") => {
  return seeds.value.find(s => s.seed === seed && s.type === type && s.draw === draw)
}
</script>

<template>
  <dashboard-subpanel
    id="seeds"
    title="Seeds"
    :icon="ICONS.seeds"
  >
    <template #right>
      <dev-only>
        <events-seeds-update
          :refresh
          icon-only
        />
      </dev-only>
      <events-seeds-chart
        v-if="seeds.length"
        :seeds
      />
    </template>

    <u-table
      :data="consolidatedSeeds"
      :columns
      :loading="status === 'pending'"
      sticky
      render-fallback-value="—"
      v-model:column-pinning="columnPinning"
      class="max-h-150"
    >
      <template #loading>
        <u-icon
          :name="icons.loading"
          class="size-8"
        />
      </template>
      <template #empty>
        <empty
          message="No seeds found"
          :icon="ICONS.noTournament"
          class="mx-2"
        >
          <dev-only>
            <events-seeds-update
              :refresh
              icon-only
            />
          </dev-only>
        </empty>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
