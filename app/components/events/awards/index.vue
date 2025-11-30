<script setup lang="ts">
import { DevOnly, EventsAwardsUpdate } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { id, edId, tour }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()

const {
  data: awards,
  status,
  refresh
} = await useFetch("/api/events/awards", {
  query: { edId, tour },
  default: () => []
})

const consolidatedRounds = computed(() => {
  const uniqueRounds = useArrayUnique(awards.value.map(a => a.round)).value

  return uniqueRounds.map(round => {
    const singles = awards.value.find(a => a.round === round && a.type === "Singles")
    const doubles = awards.value.find(a => a.round === round && a.type === "Doubles")

    return {
      round,
      singlesPm: singles?.pm ?? null,
      singlesPoints: singles?.points ?? null,
      doublesPm: doubles?.pm ?? null,
      doublesPoints: doubles?.points ?? null,
      currency: singles?.currency ?? doubles?.currency ?? null
    }
  })
})

const getRound = (round: string, type: "Singles" | "Doubles") => {
  return awards.value.find(a => a.round === round && a.type === type)
}

type ConsolidatedRound = (typeof consolidatedRounds.value)[number]

const columnHelper = createColumnHelper<ConsolidatedRound>()

const columns: TableColumn<ConsolidatedRound>[] = [
  { accessorKey: "round", header: "Round" },
  columnHelper.group({
    header: "Singles",
    columns: [
      {
        accessorKey: "singlesPm",
        header: "Prize Money",
        cell: ({ row, cell }) => {
          const pm = row.original.singlesPm
          const currency = row.original.currency

          if (isDefined(pm) && currency) {
            return h(
              DevOnly,
              {},
              {
                default: () =>
                  h(
                    EventsAwardsUpdate,
                    {
                      refresh,
                      round: getRound(row.original.round, "Singles")
                    },
                    () => {
                      return pm.toLocaleString("en-GB", {
                        style: "currency",
                        currency
                      })
                    }
                  ),
                fallback: () =>
                  pm.toLocaleString("en-GB", {
                    style: "currency",
                    currency
                  })
              }
            )
          } else {
            cell.renderValue()
          }
        }
      },
      {
        accessorKey: "singlesPoints",
        header: "Points",
        cell: ({ row, cell }) => {
          const points = row.original.singlesPoints

          if (isDefined(points)) {
            return h(
              DevOnly,
              {},
              {
                default: () =>
                  h(
                    EventsAwardsUpdate,
                    {
                      refresh,
                      round: getRound(row.original.round, "Singles")
                    },
                    () => {
                      return points.toLocaleString()
                    }
                  ),
                fallback: () => points.toLocaleString()
              }
            )
          } else {
            cell.renderValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    header: "Doubles",
    columns: [
      {
        accessorKey: "doublesPm",
        header: "Prize Money",
        cell: ({ row, cell }) => {
          const pm = row.original.doublesPm
          const currency = row.original.currency

          if (isDefined(pm) && currency) {
            return h(
              DevOnly,
              {},
              {
                default: () =>
                  h(
                    EventsAwardsUpdate,
                    {
                      refresh,
                      round: getRound(row.original.round, "Doubles")
                    },
                    () => {
                      return pm.toLocaleString("en-GB", {
                        style: "currency",
                        currency
                      })
                    }
                  ),
                fallback: () =>
                  pm.toLocaleString("en-GB", {
                    style: "currency",
                    currency
                  })
              }
            )
          } else {
            cell.renderValue()
          }
        }
      },
      {
        accessorKey: "doublesPoints",
        header: "Points",
        cell: ({ row, cell }) => {
          const points = row.original.doublesPoints

          if (isDefined(points)) {
            return h(
              DevOnly,
              {},
              {
                default: () =>
                  h(
                    EventsAwardsUpdate,
                    {
                      refresh,
                      round: getRound(row.original.round, "Doubles")
                    },
                    () => {
                      return points.toLocaleString()
                    }
                  ),
                fallback: () => points.toLocaleString()
              }
            )
          } else {
            cell.renderValue()
          }
        }
      }
    ]
  })
]

const columnPinning = ref({
  left: ["round"],
  right: []
})
</script>

<template>
  <dashboard-subpanel
    id="awards"
    title="Awards"
    :icon="ICONS.awards"
  >
    <template #right>
      <dev-only>
        <events-awards-update
          :refresh
          icon-only
        />
      </dev-only>

      <events-awards-chart
        v-if="awards.length"
        :awards
      />
    </template>

    <u-table
      :data="consolidatedRounds"
      :columns
      :loading="status === 'pending'"
      sticky
      render-fallback-value="—"
      v-model:column-pinning="columnPinning"
    >
      <template #loading>
        <u-icon
          :name="icons.loading"
          class="size-8"
        />
      </template>
      <template #empty>
        <empty
          message="No awards found"
          :icon="ICONS.noAwards"
          class="mx-2"
        >
          <dev-only>
            <events-awards-update
              :refresh
              icon-only
            />
          </dev-only>
        </empty>
      </template>
    </u-table>

    <div
      v-if="id === '605'"
      class="text-dimmed mt-3 text-sm"
    >
      <div>
        Points and prize money for the round robin rounds are awarded per win. E.g., if a player wins 2 matches in the round robin stage and the
        points/prize money for that round is 100/$1,000, the player will receive 200 points/$2,000. In addition, points and prize money are cumulative
        across rounds. E.g., if a player wins the semifinals after winning 2 matches in the round robin stage, they will receive the points/prize
        money for the round robin stage plus the points/prize money for the semifinals.
      </div>
      <div>
        Participation prize money is for participation for all 3 round robin matches. This prize money is not necessarily awarded equally for each
        round robin match.
      </div>
    </div>
  </dashboard-subpanel>
</template>
